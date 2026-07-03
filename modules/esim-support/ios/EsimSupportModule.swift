import ExpoModulesCore
import CoreTelephony

public class EsimSupportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EsimSupport")

    // Raw signals for the JS policy layer (src/lib/esimPolicy.ts). We deliberately
    // do NOT decide here: CoreTelephony's positive is entitlement-locked (false on
    // normal builds even with eSIM hardware), so JS combines these with signals
    // native can't see (proven on-device installs) into a four-state verdict —
    // supported / likely / unsupported / unknown. Read esimPolicy.ts's header
    // before changing what is reported or how it is interpreted.
    AsyncFunction("getSignals") { () -> [String: Any] in
      return Self.collectSignals()
    }

    // Back-compat: preserved so an older JS bundle paired with a newer native
    // binary still resolves. Same positive-OR-model behaviour as before.
    AsyncFunction("isSupported") { () -> Bool in
      let s = Self.collectSignals()
      let api = (s["apiSupported"] as? Bool) ?? false
      let model = (s["modelInfersEsim"] as? Bool) ?? false
      return api || model
    }
  }

  private static func collectSignals() -> [String: Any] {
    // CoreTelephony's eSIM APIs are gated behind the carrier-only
    // `cellular-plan-provisioning` entitlement, so on a normal app they can
    // return false even on eSIM-capable hardware. We expose this as a positive
    // signal only — JS decides how to treat a `false` (see esimPolicy.ts).
    let provisioning = CTCellularPlanProvisioning()
    let apiSupported: Bool
    if #available(iOS 16.0, *) {
      apiSupported = provisioning.supportsEmbeddedSIM
    } else {
      apiSupported = provisioning.supportsCellularPlan()
    }

    var isSimulator = false
    #if targetEnvironment(simulator)
    isSimulator = true
    #endif

    let model = deviceModelIdentifier()
    return [
      "apiSupported": apiSupported,
      "modelInfersEsim": deviceSupportsEsimByModel(model),
      "isSimulator": isSimulator,
      "model": model,
      "osMajor": ProcessInfo.processInfo.operatingSystemVersion.majorVersion,
      "platform": "ios",
    ]
  }

  // Hardware identifier, e.g. "iPhone15,2".
  private static func deviceModelIdentifier() -> String {
    var systemInfo = utsname()
    uname(&systemInfo)
    return Mirror(reflecting: systemInfo.machine).children.reduce(into: "") { id, element in
      if let value = element.value as? Int8, value != 0 {
        id.append(Character(UnicodeScalar(UInt8(value))))
      }
    }
  }

  // Every iPhone since the iPhone XS / XR ("iPhone11,x", 2018) ships with eSIM in
  // most regions. NOTE: this is a heuristic — it CANNOT distinguish a global eSIM
  // iPhone from a same-model mainland-China dual-physical-SIM variant (no public
  // API can). JS therefore maps modern-iPhone-without-OS-positive to the honest
  // 'likely' state (never a certain green); the certain verdicts come from the
  // OS positive, the ≤ iPhone X hardware fact, or a proven on-device install.
  private static func deviceSupportsEsimByModel(_ identifier: String) -> Bool {
    guard identifier.hasPrefix("iPhone") else { return false }
    let digits = identifier.dropFirst("iPhone".count).prefix { $0.isNumber }
    guard let major = Int(digits) else { return false }
    return major >= 11
  }
}
