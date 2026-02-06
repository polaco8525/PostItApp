package com.postitapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.postitapp.MainActivity
import com.postitapp.R

/**
 * Implementation of App Widget functionality for PostIt notes.
 * App Widget Configuration is implemented in [PostItWidgetConfigActivity]
 */
class PostItWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // There may be multiple widgets active, so update all of them
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        // When the user deletes the widget, delete the preference associated with it.
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        for (appWidgetId in appWidgetIds) {
            editor.remove(PREF_PREFIX_TEXT + appWidgetId)
            editor.remove(PREF_PREFIX_COLOR + appWidgetId)
        }
        editor.apply()
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }

    companion object {
        const val PREFS_NAME = "com.postitapp.widget.PostItWidgetProvider"
        const val PREF_PREFIX_TEXT = "widget_text_"
        const val PREF_PREFIX_COLOR = "widget_color_"

        // Color constants
        val COLORS = mapOf(
            "yellow" to 0xFFFFEB3B.toInt(),
            "pink" to 0xFFF48FB1.toInt(),
            "blue" to 0xFF81D4FA.toInt(),
            "green" to 0xFFA5D6A7.toInt(),
            "orange" to 0xFFFFCC80.toInt(),
            "purple" to 0xFFCE93D8.toInt()
        )

        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val text = prefs.getString(PREF_PREFIX_TEXT + appWidgetId, "Toque para adicionar nota") ?: ""
            val colorName = prefs.getString(PREF_PREFIX_COLOR + appWidgetId, "yellow") ?: "yellow"
            val color = COLORS[colorName] ?: COLORS["yellow"]!!

            // Construct the RemoteViews object
            val views = RemoteViews(context.packageName, R.layout.postit_widget)
            views.setTextViewText(R.id.widget_text, text)
            views.setInt(R.id.widget_background, "setBackgroundColor", color)

            // Create an Intent to launch the app when widget is clicked
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_background, pendingIntent)

            // Instruct the widget manager to update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun saveWidgetData(context: Context, appWidgetId: Int, text: String, color: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putString(PREF_PREFIX_TEXT + appWidgetId, text)
                putString(PREF_PREFIX_COLOR + appWidgetId, color)
                apply()
            }
        }
    }
}
