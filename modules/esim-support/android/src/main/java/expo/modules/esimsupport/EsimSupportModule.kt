package expo.modules.esimsupport

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.euicc.EuiccManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EsimSupportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EsimSupport")

    // Raw signals for the JS policy layer (src/lib/esimPolicy.ts).
    //  - hardwareSupported: OEM-declared eUICC hardware feature — the truth
    //    signal that lets JS produce a CERTAIN red on devices without eSIM
    //    (EuiccManager.isEnabled alone can be false when eSIM is merely
    //    switched off, which must never be reported as "no hardware").
    //  - apiSupported: eUICC present AND currently enabled.
    //  - null hardwareSupported (SDK < 28) tells JS the signal is unavailable;
    //    the policy then treats the old-OS case via osMajor.
    AsyncFunction("getSignals") {
      mapOf(
        "apiSupported" to euiccEnabled(),
        "hardwareSupported" to euiccHardwareSupported(),
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

  // EuiccManager.isEnabled reports whether the eUICC is present AND enabled —
  // a positive is trustworthy; a negative is ambiguous (see hardware check).
  private fun euiccEnabled(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
    val context = appContext.reactContext ?: return false
    val euicc = context.getSystemService(Context.EUICC_SERVICE) as? EuiccManager
    return euicc?.isEnabled == true
  }

  // OEM-declared hardware capability (android.hardware.telephony.euicc).
  // true/false is authoritative for the device model; null = cannot know
  // (SDK < 28 predates both the feature flag and eSIM support itself).
  private fun euiccHardwareSupported(): Boolean? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return null
    val context = appContext.reactContext ?: return null
    return context.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY_EUICC)
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
