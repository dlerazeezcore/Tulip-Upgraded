import ExpoModulesCore
import CoreTelephony

public class EsimSupportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EsimSupport")

    AsyncFunction("isSupported") { () -> Bool in
      // CTCellularPlanProvisioning.supportsEmbeddedSIM is the canonical iOS check.
      return CTCellularPlanProvisioning().supportsEmbeddedSIM
    }
  }
}
