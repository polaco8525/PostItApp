package com.postitapp.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import com.postitapp.R

/**
 * Configuration Activity for PostIt Widget.
 * Allows users to set the text and color for the widget.
 */
class PostItWidgetConfigActivity : Activity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private lateinit var editText: EditText
    private lateinit var colorRadioGroup: RadioGroup
    private var selectedColor = "yellow"

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set the result to CANCELED. This will cause the widget host to cancel
        // out of the widget placement if the user presses the back button.
        setResult(RESULT_CANCELED)

        // Find the widget id from the intent.
        val intent = intent
        val extras = intent.extras
        if (extras != null) {
            appWidgetId = extras.getInt(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
        }

        // If this activity was started with an intent without an app widget ID, finish with an error.
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        setContentView(R.layout.postit_widget_config)

        editText = findViewById(R.id.widget_config_text)
        colorRadioGroup = findViewById(R.id.color_radio_group)

        // Set up color selection
        colorRadioGroup.setOnCheckedChangeListener { _, checkedId ->
            selectedColor = when (checkedId) {
                R.id.radio_yellow -> "yellow"
                R.id.radio_pink -> "pink"
                R.id.radio_blue -> "blue"
                R.id.radio_green -> "green"
                R.id.radio_orange -> "orange"
                R.id.radio_purple -> "purple"
                else -> "yellow"
            }
        }

        findViewById<Button>(R.id.widget_config_save).setOnClickListener {
            val text = editText.text.toString().ifEmpty { "Nova nota" }

            // Save the widget configuration
            PostItWidgetProvider.saveWidgetData(this, appWidgetId, text, selectedColor)

            // Update the widget
            val appWidgetManager = AppWidgetManager.getInstance(this)
            PostItWidgetProvider.updateAppWidget(this, appWidgetManager, appWidgetId)

            // Make sure we pass back the original appWidgetId
            val resultValue = Intent()
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            setResult(RESULT_OK, resultValue)
            finish()
        }
    }
}
