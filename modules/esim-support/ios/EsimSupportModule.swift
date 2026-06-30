import ExpoModulesCore
import CoreTelephony

public class EsimSupportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EsimSupport")

    AsyncFunction("isSupported") { () -> Bool in
      let provisioning = CTCellularPlanProvisioning()
      // supportsEmbeddedSIM is the canonical eSIM check, but it's iOS 16.0+.
      if #available(iOS 16.0, *) {
        return provisioning.supportsEmbeddedSIM
      }
      // iOS 12–15 fallback: supportsCellularPlan() was the pre-iOS-16 way to
      // tell whether the device can provision an eSIM.
      return provisioning.supportsCellularPlan()
    }
  }
}
