package com.chase.miredgains

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.chase.miredgains.ui.theme.MiredGainsTheme
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.ui.graphics.vector.ImageVector
import com.chase.miredgains.data.AppDatabase
import com.chase.miredgains.data.WorkoutRepository
import com.chase.miredgains.ui.AppViewModel
import com.chase.miredgains.ui.AppViewModelFactory
import com.chase.miredgains.ui.screens.ExercisesScreen
import com.chase.miredgains.ui.screens.HistoryScreen
import com.chase.miredgains.ui.screens.SyncScreen
import com.chase.miredgains.ui.screens.WorkoutScreen

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Workout : Screen("workout", "Workout", Icons.Default.Build)
    object History : Screen("history", "History", Icons.Default.DateRange)
    object Exercises : Screen("exercises", "Exercises", Icons.Default.List)
    object Sync : Screen("sync", "Sync", Icons.Default.PhoneAndroid)
}

class MainActivity : ComponentActivity() {
    private val database by lazy { AppDatabase.getDatabase(this) }
    private val repository by lazy { WorkoutRepository(database.workoutDao()) }
    private val viewModel: AppViewModel by viewModels {
        AppViewModelFactory(repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MiredGainsTheme {
                MainApp(viewModel)
            }
        }
    }
}

@Composable
fun MainApp(viewModel: AppViewModel) {
    val navController = rememberNavController()
    val screens = listOf(
        Screen.Workout,
        Screen.History,
        Screen.Exercises,
        Screen.Sync
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                screens.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = null) },
                        label = { Text(screen.label) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Workout.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Workout.route) { WorkoutScreen(viewModel) }
            composable(Screen.History.route) { HistoryScreen(viewModel) }
            composable(Screen.Exercises.route) { ExercisesScreen(viewModel) }
            composable(Screen.Sync.route) { SyncScreen(viewModel) }
        }
    }
}
