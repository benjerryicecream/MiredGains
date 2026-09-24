package com.chase.miredgains

import android.app.Application
import com.chase.miredgains.data.AppDatabase
import com.chase.miredgains.data.DEFAULT_EXERCISES
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MiredGainsApp : Application() {
    override fun onCreate() {
        super.onCreate()
        
        val db = AppDatabase.getDatabase(this)
        val dao = db.workoutDao()
        
        CoroutineScope(Dispatchers.IO).launch {
            val existing = dao.getAllExercises().first()
            if (existing.isEmpty()) {
                DEFAULT_EXERCISES.forEach { dao.insertExercise(it) }
            }
        }
    }
}
