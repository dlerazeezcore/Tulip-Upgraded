package expo.modules.esimsupport

import android.content.Context
import android.os.Build
import android.telephony.euicc.EuiccManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EsimSupportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EsimSupport")

    // Raw signals for the JS policy layer (src/lib/esimPolicy.ts). Symmetric with
    // iOS: there is no model heuristic on Android, so `modelInfersEsim` is false.
    AsyncFunction("getSignals") {
      mapOf(
        "apiSupported" to euiccEnabled(),
        "modelInfersEsim" to false,
        "isSimulator" to isEmulator(),
        "model" to Build.MODEL,
        "osMajor" to Build.VERSION.SDK_INT,
        "platform" to "android",
      )
    }

    // Back-compat.
    AsyncFunction("isSupported") { euiccEnabled() }
  }

  // EuiccManager.isEnabled reports whether the device supports eUICC (eSIM).
  private fun euiccEnabled(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
    val context = appContext.reactContext ?: return false
    val euicc = context.getSystemService(Context.EUICC_SERVICE) as? EuiccManager
    return euicc?.isEnabled == true
  }

  // Best-effort emulator detection. Emulators lack eUICC (isEnabled == false), so
  // this lets JS classify an emulator as 'unknown' rather than a hard negative,
  // matching the iOS-simulator carve-out.
  private fun isEmulator(): Boolean {
    return (Build.FINGERPRINT.startsWith("generic")
      || Build.FINGERPRINT.startsWith("unknown")
      || Build.MODEL.contains("Emulator")
      || Build.MODEL.contains("Android SDK built for")
      || Build.MANUFACTURER.contains("Genymotion")
      || Build.PRODUCT.contains("sdk")
      || Build.HARDWARE.contains("goldfish")
      || Build.HARDWARE.contains("ranchu"))
  }
}
