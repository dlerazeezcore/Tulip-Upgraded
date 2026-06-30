import ExpoModulesCore
import CoreTelephony

public class EsimSupportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EsimSupport")

    AsyncFunction("isSupported") { () -> Bool in
      // CoreTelephony's eSIM APIs are gated behind the carrier-only
      // `cellular-plan-provisioning` entitlement, so on a normal app they often
      // return false even on eSIM-capable hardware (e.g. iPhone 16e). Treat the
      // API as a positive-only signal and OR it with a reliable model check.
      let provisioning = CTCellularPlanProvisioning()
      let apiSupported: Bool
      if #available(iOS 16.0, *) {
        apiSupported = provisioning.supportsEmbeddedSIM
      } else {
        apiSupported = provisioning.supportsCellularPlan()
      }
      if apiSupported { return true }

      return Self.deviceSupportsEsimByModel()
    }
  }

  // Every iPhone since the iPhone XS / XR (hardware identifier "iPhone11,x",
  // released 2018) ships with eSIM. Parsing the identifier and treating a major
  // number >= 11 as eSIM-capable is deterministic and also covers brand-new
  // models the CoreTelephony API refuses to report.
  private static func deviceSupportsEsimByModel() -> Bool {
    var systemInfo = utsname()
    uname(&systemInfo)
    let identifier = Mirror(reflecting: systemInfo.machine).children.reduce(into: "") { id, element in
      if let value = element.value as? Int8, value != 0 {
        id.append(Character(UnicodeScalar(UInt8(value))))
      }
    }
    guard identifier.hasPrefix("iPhone") else { return false }
    let digits = identifier.dropFirst("iPhone".count).prefix { $0.isNumber }
    guard let major = Int(digits) else { return false }
    return major >= 11
  }
}
