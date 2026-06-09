package com.smartpavementguard.app.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.LocationServices
import androidx.activity.ComponentActivity
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlin.math.sqrt
import com.smartpavementguard.app.BASE_URL
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import kotlin.concurrent.thread

@Composable
fun TripScreen(
    activity: ComponentActivity,
    onBack: () -> Unit
){
    val context = LocalContext.current

    var showDialog by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("Monitoreando vibraciones") }
    var lastIntensity by remember { mutableStateOf(0f) }
    var lastImpactTime by remember { mutableStateOf(0L) }

    var latitude by remember { mutableStateOf<Double?>(null) }
    var longitude by remember { mutableStateOf<Double?>(null) }

    val fusedLocationClient = remember {
        LocationServices.getFusedLocationProviderClient(activity)
    }

    LaunchedEffect(Unit) {
        if (
            ActivityCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                100
            )
            status = "Permiso de ubicación requerido"
        } else {
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    latitude = location.latitude
                    longitude = location.longitude
                    status = "GPS activo - monitoreando"
                } else {
                    status = "GPS buscando ubicación"
                }
            }
        }
    }


    val anomalies = remember { mutableStateListOf<Float>() }

    DisposableEffect(Unit) {
        val sensorManager =
            context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

        val accelerometer =
            sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        val listener = object : SensorEventListener {

            override fun onSensorChanged(event: SensorEvent) {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]

                val magnitude = sqrt(x * x + y * y + z * z)
                lastIntensity = magnitude

                val now = System.currentTimeMillis()

                if (magnitude > 22f && now - lastImpactTime > 2500) {
                    lastImpactTime = now
                    anomalies.add(magnitude)
                    status = "Anomalía detectada"
                }
            }

            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }

        sensorManager.registerListener(
            listener,
            accelerometer,
            SensorManager.SENSOR_DELAY_NORMAL
        )

        onDispose {
            sensorManager.unregisterListener(listener)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AquaBg)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        Text(
            text = "Monitoreo Inteligente",
            color = AquaPrimary,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = AquaCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {

                Text("Estado", color = AquaText)
                Text("● $status", color = AquaPrimary)

                Spacer(modifier = Modifier.height(12.dp))

                Text("Ubicación actual", color = AquaText)
                Text("Latitud: ${latitude ?: "Detectando..."}", color = AquaMuted)
                Text("Longitud: ${longitude ?: "Detectando..."}", color = AquaMuted)

                Spacer(modifier = Modifier.height(16.dp))

                Text("Intensidad actual", color = AquaText)
                Text(
                    "%.2f".format(lastIntensity),
                    color = AquaMuted
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text("Anomalías detectadas", color = AquaText)
                Text(
                    anomalies.size.toString(),
                    color = AquaYellow,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Simula un tope o vibración fuerte moviendo el teléfono.",
            color = AquaMuted
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (anomalies.isNotEmpty()) {
                    showDialog = true
                } else {
                    onBack()
                }
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = AquaPrimary,
                contentColor = Color.Black
            )
        ) {
            Text("Finalizar Viaje")
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = {
                Text("Anomalías detectadas")
            },
            text = {
                Text(
                    "Durante el recorrido se detectaron ${anomalies.size} posibles anomalías.\n\n¿Deseas enviarlas como reportes?"
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDialog = false

                        thread {
                            try {
                                val client = OkHttpClient()

                                anomalies.forEach { impactValue ->
                                    val json = JSONObject()
                                    json.put("userId", 1)
                                    json.put("impact", impactValue)
                                    json.put("speed", 0)
                                    json.put("latitude", latitude ?: 18.8467431)
                                    json.put("longitude", longitude ?: -97.1305888)

                                    val body = json.toString()
                                        .toRequestBody("application/json".toMediaType())

                                    val request = Request.Builder()
                                        .url("$BASE_URL/automatic-report")
                                        .post(body)
                                        .build()

                                    client.newCall(request).execute().use { response ->
                                        println("AUTO REPORT: ${response.body?.string()}")
                                    }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }

                        onBack()
                    }
                ) {
                    Text("Sí, enviar")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        anomalies.clear()
                        showDialog = false
                        onBack()
                    }
                ) {
                    Text("No, descartar")
                }
            }
        )
    }
}