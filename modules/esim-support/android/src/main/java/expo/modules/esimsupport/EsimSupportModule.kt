package expo.modules.esimsupport

import android.content.Context
import android.os.Build
import android.telephony.euicc.EuiccManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EsimSupportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EsimSupport")

    AsyncFunction("isSupported") {
      // EuiccManager.isEnabled reports whether the device supports eUICC (eSIM).
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return@AsyncFunction false
      val context = appContext.reactContext ?: return@AsyncFunction false
      val euicc = context.getSystemService(Context.EUICC_SERVICE) as? EuiccManager
      euicc?.isEnabled == true
    }
  }
}
