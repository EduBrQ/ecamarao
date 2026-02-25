package com.ecamarao.app

import android.content.Context
import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0"
    }

    @JavascriptInterface
    fun getPlatform(): String {
        return "Android"
    }

    @JavascriptInterface
    fun vibrate(duration: Int = 200) {
        // Implementar vibração se necessário
        // Vibrator vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        // if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        //     vibrator.vibrate(VibrationEffect.createOneShot(duration.toLong(), VibrationEffect.DEFAULT_AMPLITUDE))
        // } else {
        //     vibrator.vibrate(duration.toLong())
        // }
    }
}
