import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal, RefreshControl,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../context/AuthContext';
import {
  buscarAlumnoMatricula,
  buildFileUrl,
  getOficialDentro,
  registrarEntradaOficial,
  registrarSalidaOficial,
  registrarVehiculoOficial,
} from '../services/api';

const GREEN = '#2E7D32';
const GREEN_DARK = '#1B5E20';
const GREEN_LIGHT = '#E8F5E9';

function Reloj() {
  const [hora, setHora] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setHora(d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <Text style={s.reloj}>{hora}</Text>;
}

function extraerMatriculaDesdeQR(data) {
  const raw = String(data || '').trim();
  if (!raw) return '';

  try {
    const obj = JSON.parse(raw);
    return String(
      obj.matricula ||
      obj.alumno?.matricula ||
      obj.id_alumno ||
      obj.id_usuario ||
      ''
    ).trim();
  } catch (_) {
    // No era JSON. Intentar como URL o texto plano.
  }

  const fromUrl = raw.match(/(?:matricula|m|alumno)=([^&]+)/i);
  if (fromUrl?.[1]) return decodeURIComponent(fromUrl[1]).trim();

  const digits = raw.match(/\b\d{6,12}\b/);
  if (digits?.[0]) return digits[0].trim();

  return raw;
}

export default function OficialScreen({ navigation }) {
  const { token, handleTokenExpired, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [matricula, setMatricula] = useState('');
  const [alumnoEncontrado, setAlumnoEncontrado] = useState(null);
  const [vehiculoSelec, setVehiculoSelec] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusq, setErrorBusq] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  // Formulario de vehículo adicional en caseta
  const [mostrarFormVeh, setMostrarFormVeh]   = useState(false);
  const [formVeh, setFormVeh]                 = useState({ placas: '', marca: '', modelo: '', color: '', tipo: 'auto' });
  const [guardandoVeh, setGuardandoVeh]       = useState(false);
  const [errorVeh, setErrorVeh]               = useState('');
  const TIPOS_VEH = [
    { label: 'Auto', value: 'auto' },
    { label: 'Moto', value: 'moto' },
    { label: 'Otro', value: 'otro' },
  ];

  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [dentro, setDentro] = useState([]);
  const [stats, setStats] = useState({ total: 0, por_manual: 0, por_qr: 0 });
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const inputRef = useRef(null);

  const limpiarAlumno = () => {
    setAlumnoEncontrado(null);
    setVehiculoSelec(null);
    setMostrarFormVeh(false);
    setFormVeh({ placas: '', marca: '', modelo: '', color: '', tipo: 'auto' });
    setErrorVeh('');
  };

  const cerrarAlumnoModal = () => {
    setModalVisible(false);
    limpiarAlumno();
  };

  const cargarDentro = useCallback(async (silent = false) => {
    if (!silent) setCargando(true);

    try {
      const d = await getOficialDentro(token, handleTokenExpired);
      console.log('[Oficial] /dentro respuesta raw:', JSON.stringify(d).slice(0, 300));

      const lista = Array.isArray(d?.dentro) ? d.dentro : Array.isArray(d) ? d : [];
      console.log('[Oficial] alumnosDentro count:', lista.length, '| primer item:', JSON.stringify(lista[0] || null));

      setDentro([...lista]);

      const rawStats = d?.stats || {};
      setStats({
        total: Number(rawStats.total ?? lista.length),
        por_manual: Number(rawStats.por_manual ?? 0),
        por_qr: Number(rawStats.por_qr ?? 0),
      });
    } catch (err) {
      console.error('[Oficial] Error cargarDentro:', err?.message || err);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [token, handleTokenExpired]);

  useEffect(() => {
    cargarDentro();
  }, [cargarDentro]);

  const abrirScanner = async () => {
    setErrorBusq('');

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Permiso de camara',
          'Se necesita acceso a la camara para escanear el QR del alumno.'
        );
        return;
      }
    }

    setScanned(false);
    setScannerVisible(true);
  };

  const buscarPorMatricula = async (mat, origen = 'manual') => {
    const value = String(mat || '').trim();
    if (!value) return;

    setBuscando(true);
    setErrorBusq('');
    limpiarAlumno();

    try {
      console.log(`[Oficial] Buscando por ${origen}:`, value);
      const a = await buscarAlumnoMatricula(token, value, handleTokenExpired);
      console.log('[Oficial] Alumno encontrado:', JSON.stringify(a).slice(0, 300));

      setMatricula(value);
      setAlumnoEncontrado(a);
      setVehiculoSelec(a?.vehiculos?.[0] || null);
      setModalVisible(true);
    } catch (e) {
      const msg = e?.message || 'Alumno no encontrado';
      if (origen === 'qr') {
        Alert.alert('QR no valido o alumno no encontrado', msg);
      } else {
        setErrorBusq(msg);
      }
    } finally {
      setBuscando(false);
    }
  };

  const buscar = () => buscarPorMatricula(matricula, 'manual');

  const onQRScanned = ({ data }) => {
    if (scanned) return;

    setScanned(true);
    setScannerVisible(false);

    const mat = extraerMatriculaDesdeQR(data);
    console.log('[Oficial] QR raw:', data);
    console.log('[Oficial] QR matricula extraida:', mat);

    if (!mat) {
      Alert.alert('QR no valido', 'No se pudo obtener la matricula del codigo.');
      return;
    }

    buscarPorMatricula(mat, 'qr');
  };

  // Registrar vehículo adicional desde caseta y seleccionarlo automáticamente
  const registrarVehiculoCaseta = async () => {
    if (!formVeh.placas.trim() || !formVeh.color.trim()) {
      setErrorVeh('Placas y color son obligatorios'); return;
    }
    setGuardandoVeh(true); setErrorVeh('');
    try {
      const nuevoVeh = await registrarVehiculoOficial(
        token,
        alumnoEncontrado.id_usuario,
        {
          placas: formVeh.placas.trim(),
          marca:  formVeh.marca.trim()  || null,
          modelo: formVeh.modelo.trim() || null,
          color:  formVeh.color.trim(),
          tipo:   formVeh.tipo,
        },
        handleTokenExpired
      );
      // Agregar el nuevo vehículo a la lista y seleccionarlo
      setAlumnoEncontrado(prev => ({
        ...prev,
        vehiculos: [...(prev.vehiculos || []), nuevoVeh],
      }));
      setVehiculoSelec(nuevoVeh);
      setMostrarFormVeh(false);
      setFormVeh({ placas: '', marca: '', modelo: '', color: '', tipo: 'auto' });
    } catch (e) {
      console.error('[registrarVehiculoCaseta]', e.message);
      setErrorVeh(e.message || 'Error al registrar vehículo');
    } finally {
      setGuardandoVeh(false);
    }
  };

  const registrarEntrada = async () => {
    if (!alumnoEncontrado) return;
    setRegistrando(true);

    try {
      const payload = {
        id_alumno: alumnoEncontrado.id_usuario,
        id_vehiculo: vehiculoSelec?.id_vehiculo ?? null,
      };

      console.log('[Oficial] Registrando entrada payload:', JSON.stringify(payload));
      const respEntrada = await registrarEntradaOficial(token, payload, handleTokenExpired);
      console.log('[Oficial] Respuesta entrada:', JSON.stringify(respEntrada));

      const nombre = `${alumnoEncontrado.nombre} ${alumnoEncontrado.apellido_paterno}`;

      setModalVisible(false);
      setMatricula('');
      limpiarAlumno();

      await cargarDentro(true);

      Alert.alert('Entrada registrada', `${nombre} ingreso al campus.`);
    } catch (e) {
      console.error('[Oficial] Error entrada:', e?.message || e);
      Alert.alert('Error', e.message || 'No se pudo registrar la entrada.');
    } finally {
      setRegistrando(false);
    }
  };

  const registrarSalida = (id_alumno, nombre) => {
    Alert.alert('Registrar salida', `Registrar la salida de ${nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await registrarSalidaOficial(token, id_alumno, handleTokenExpired);
            await cargarDentro(true);
          } catch (e) {
            Alert.alert('Error', e.message || 'No se pudo registrar la salida.');
          }
        },
      },
    ]);
  };

  const fecha = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.headerLabel}>CASETA DE ACCESO</Text>
          <Reloj />
          <Text style={s.headerFecha}>{fecha}</Text>
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.histBtn}
            onPress={() => navigation.navigate('HistorialAccesos')}
          >
            <Text style={s.histBtnTxt}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Cerrar sesion', 'Salir?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: logout },
              ])
            }
          >
            <Text style={s.salirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.statsRow}>
        {[
          { label: 'Dentro', valor: stats.total ?? dentro.length, color: GREEN },
          { label: 'Manual', valor: stats.por_manual ?? 0, color: '#558B2F' },
          { label: 'QR', valor: stats.por_qr ?? 0, color: '#1565C0' },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={[s.statValor, { color: st.color }]}>{st.valor}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.accionesCard}>
        <Text style={s.accionesTitulo}>Registrar acceso</Text>
        <Text style={s.accionesSub}>Escanea el QR del alumno o busca por matricula.</Text>

        <View style={s.accionesRow}>
          <TouchableOpacity style={s.qrBtn} onPress={abrirScanner}>
            <Text style={s.qrBtnIcon}>QR</Text>
            <Text style={s.qrBtnTxt}>Escanear QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.manualBtn} onPress={() => inputRef.current?.focus()}>
            <Text style={s.manualBtnIcon}>ID</Text>
            <Text style={s.manualBtnTxt}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.buscadorCard}>
        <Text style={s.buscadorLabel}>Busqueda por matricula</Text>
        <View style={s.buscadorRow}>
          <TextInput
            ref={inputRef}
            style={s.buscadorInput}
            value={matricula}
            onChangeText={v => { setMatricula(v); setErrorBusq(''); }}
            placeholder="Ej. 26230013"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={buscar}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[s.buscadorBtn, buscando && { opacity: 0.6 }]}
            onPress={buscar}
            disabled={buscando}
          >
            {buscando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.buscadorBtnTxt}>Buscar</Text>
            }
          </TouchableOpacity>
        </View>
        {!!errorBusq && <Text style={s.errorBusq}>Atencion: {errorBusq}</Text>}
      </View>

      <Text style={s.seccion}>Alumnos dentro del campus ({dentro.length})</Text>

      {cargando ? (
        <ActivityIndicator color={GREEN} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={dentro}
          keyExtractor={(item, index) =>
            item?.id_registro != null
              ? String(item.id_registro)
              : `alumno-${item?.id_usuario ?? index}`
          }
          extraData={dentro}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargarDentro(true); }}
              tintColor={GREEN}
            />
          }
          ListEmptyComponent={
            <View style={s.vacioBox}>
              <Text style={s.vacioEmoji}>Campus</Text>
              <Text style={s.vacioTxt}>Sin alumnos dentro del campus</Text>
            </View>
          }
          renderItem={({ item }) => {
            const entrada = new Date(item.hora_entrada)
              .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            const nombre = `${item.nombre} ${item.apellido_paterno}`;
            const inicial = (item.nombre || '?').charAt(0).toUpperCase();

            return (
              <View style={s.alumnoCard}>
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{inicial}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.alumnoNombre}>{nombre}</Text>
                  <Text style={s.alumnoMeta}>{item.matricula}</Text>
                  <Text style={s.alumnoMeta}>Entrada: {entrada} - {item.tipo_acceso}</Text>
                  {!!item.placas && (
                    <Text style={s.alumnoMeta}>
                      Vehiculo: {item.placas}{item.marca ? ` - ${item.marca}` : ''}{item.modelo ? ` ${item.modelo}` : ''}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={s.btnSalida}
                  onPress={() => registrarSalida(item.id_usuario, nombre)}
                >
                  <Text style={s.btnSalidaTxt}>Salida</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={s.scannerRoot}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : onQRScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />

          <View style={s.scannerTop}>
            <Text style={s.scannerTitle}>Escanear QR</Text>
            <TouchableOpacity
              style={s.scannerCerrar}
              onPress={() => setScannerVisible(false)}
            >
              <Text style={s.scannerCerrarTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <View style={s.scanFrame}>
            <View style={s.scanCornerTL} />
            <View style={s.scanCornerTR} />
            <View style={s.scanCornerBL} />
            <View style={s.scanCornerBR} />
          </View>

          <View style={s.scannerHelp}>
            <Text style={s.scannerHelpTxt}>
              Coloca el QR de la credencial dentro del recuadro.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarAlumnoModal}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            {alumnoEncontrado ? (
              <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={{ alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Foto de identidad: foto_selfie tiene prioridad sobre inicial */}
                {alumnoEncontrado.foto_selfie ? (
                  <Image
                    source={{ uri: buildFileUrl(alumnoEncontrado.foto_selfie) }}
                    style={s.modalAvatarImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[
                    s.modalAvatar,
                    alumnoEncontrado.activo && alumnoEncontrado.identidad_verificada
                      ? { backgroundColor: GREEN_LIGHT }
                      : { backgroundColor: '#FFEBEE' },
                  ]}>
                    <Text style={s.modalAvatarTxt}>
                      {(alumnoEncontrado.nombre || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <Text style={s.modalNombre}>
                  {alumnoEncontrado.nombre} {alumnoEncontrado.apellido_paterno}
                </Text>
                <Text style={s.modalMat}>{alumnoEncontrado.matricula}</Text>
                {!!alumnoEncontrado.carrera && <Text style={s.modalMeta}>{alumnoEncontrado.carrera}</Text>}
                {!!alumnoEncontrado.grupo && <Text style={s.modalMeta}>Grupo: {alumnoEncontrado.grupo}</Text>}

                {/* Vehículos registrados */}
                <View style={[s.vehiculosBox, { width: '100%' }]}>
                  <Text style={s.vehiculosLabel}>Vehículo</Text>
                  {(alumnoEncontrado.vehiculos?.length > 0) && alumnoEncontrado.vehiculos.map(v => (
                    <TouchableOpacity
                      key={v.id_vehiculo}
                      style={[s.vehiculoChip, vehiculoSelec?.id_vehiculo === v.id_vehiculo && s.vehiculoChipSel]}
                      onPress={() => setVehiculoSelec(v)}>
                      <Text style={[s.vehiculoChipTxt, vehiculoSelec?.id_vehiculo === v.id_vehiculo && { color: GREEN, fontWeight: '700' }]}>
                        {v.placas}{v.marca ? ` · ${v.marca}` : ''}{v.modelo ? ` ${v.modelo}` : ''}{v.color ? ` · ${v.color}` : ''}
                      </Text>
                      {vehiculoSelec?.id_vehiculo === v.id_vehiculo && (
                        <Text style={{ color: GREEN, fontSize: 13, fontWeight: '800' }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Registrar otro vehículo */}
                  {!mostrarFormVeh ? (
                    <TouchableOpacity style={s.btnOtroVeh} onPress={() => setMostrarFormVeh(true)}>
                      <Text style={s.btnOtroVehTxt}>+ Registrar otro vehículo</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={s.formVehBox}>
                      <Text style={s.formVehTitulo}>Nuevo vehículo</Text>
                      <TextInput style={s.formVehInput} value={formVeh.placas}
                        onChangeText={v => setFormVeh(f => ({ ...f, placas: v }))}
                        placeholder="Placas *" placeholderTextColor="#aaa" autoCapitalize="characters"/>
                      <TextInput style={s.formVehInput} value={formVeh.marca}
                        onChangeText={v => setFormVeh(f => ({ ...f, marca: v }))}
                        placeholder="Marca" placeholderTextColor="#aaa"/>
                      <TextInput style={s.formVehInput} value={formVeh.modelo}
                        onChangeText={v => setFormVeh(f => ({ ...f, modelo: v }))}
                        placeholder="Modelo" placeholderTextColor="#aaa"/>
                      <TextInput style={s.formVehInput} value={formVeh.color}
                        onChangeText={v => setFormVeh(f => ({ ...f, color: v }))}
                        placeholder="Color *" placeholderTextColor="#aaa"/>
                      <View style={s.tipoRow}>
                        {TIPOS_VEH.map(t => (
                          <TouchableOpacity key={t.value}
                            style={[s.tipoBtn, formVeh.tipo === t.value && s.tipoBtnSel]}
                            onPress={() => setFormVeh(f => ({ ...f, tipo: t.value }))}>
                            <Text style={[s.tipoBtnTxt, formVeh.tipo === t.value && s.tipoBtnTxtSel]}>
                              {t.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {!!errorVeh && <Text style={s.errorVeh}>{errorVeh}</Text>}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={s.btnVehCancelar}
                          onPress={() => { setMostrarFormVeh(false); setErrorVeh(''); }}>
                          <Text style={s.btnVehCancelarTxt}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.btnVehGuardar, guardandoVeh && { opacity: 0.6 }]}
                          onPress={registrarVehiculoCaseta} disabled={guardandoVeh}>
                          {guardandoVeh
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.btnVehGuardarTxt}>Guardar y seleccionar</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Estado verificación */}
                <View style={[s.modalEstado,
                  alumnoEncontrado.activo && alumnoEncontrado.identidad_verificada
                    ? { backgroundColor: GREEN_LIGHT } : { backgroundColor: '#FFEBEE' }]}>
                  <Text style={[s.modalEstadoTxt, {
                    color: alumnoEncontrado.activo && alumnoEncontrado.identidad_verificada
                      ? GREEN : '#C62828' }]}>
                    {alumnoEncontrado.activo && alumnoEncontrado.identidad_verificada
                      ? 'Verificado · Acceso autorizado'
                      : 'Cuenta no verificada · Revisar con coordinación'}
                  </Text>
                </View>

                <View style={s.modalBotones}>
                  <TouchableOpacity style={s.modalCancelar} onPress={cerrarAlumnoModal}>
                    <Text style={s.modalCancelarTxt}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalConfirmar,
                      !alumnoEncontrado.identidad_verificada && { backgroundColor: '#E65100' },
                      registrando && { opacity: 0.6 }]}
                    onPress={registrarEntrada} disabled={registrando}>
                    {registrando
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.modalConfirmarTxt}>
                          {alumnoEncontrado.identidad_verificada ? 'Registrar entrada' : 'Entrada sin verificar'}
                        </Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <ActivityIndicator color={GREEN} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F8F4' },

  header: {
    backgroundColor: GREEN,
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reloj: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  headerFecha: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  histBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  histBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  salirTxt: { color: '#ffcdd2', fontWeight: '700', fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#DDEBDD',
  },
  statValor: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#7A8A7A', fontWeight: '600', marginTop: 2 },

  accionesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 18,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#DDEBDD',
  },
  accionesTitulo: { fontSize: 16, fontWeight: '900', color: GREEN_DARK },
  accionesSub: { fontSize: 12, color: '#7A8A7A', marginTop: 2, marginBottom: 12 },
  accionesRow: { flexDirection: 'row', gap: 10 },
  qrBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBtnIcon: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 2 },
  qrBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  manualBtn: {
    flex: 1,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  manualBtnIcon: { color: GREEN, fontSize: 24, fontWeight: '900', marginBottom: 2 },
  manualBtnTxt: { color: GREEN, fontWeight: '900', fontSize: 13 },

  buscadorCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#DDEBDD',
  },
  buscadorLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#558B2F',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buscadorRow: { flexDirection: 'row', gap: 8 },
  buscadorInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDEBDD',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFCFA',
  },
  buscadorBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buscadorBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  errorBusq: { color: '#C62828', fontSize: 12, marginTop: 8 },

  seccion: {
    fontSize: 11,
    fontWeight: '900',
    color: '#558B2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  vacioBox: { alignItems: 'center', paddingTop: 32 },
  vacioEmoji: { fontSize: 20, marginBottom: 8, color: '#7A8A7A' },
  vacioTxt: { color: '#A0AAA0', fontSize: 14 },

  alumnoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#DDEBDD',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 18, fontWeight: '900', color: GREEN },
  alumnoNombre: { fontSize: 14, fontWeight: '900', color: GREEN_DARK },
  alumnoMeta: { fontSize: 12, color: '#7A8A7A', marginTop: 1 },
  btnSalida: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnSalidaTxt: { color: '#C62828', fontWeight: '900', fontSize: 12 },

  scannerRoot: { flex: 1, backgroundColor: '#000' },
  scannerTop: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  scannerCerrar: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scannerCerrarTxt: { color: '#fff', fontWeight: '800' },
  scanFrame: {
    position: 'absolute',
    top: '31%',
    alignSelf: 'center',
    width: 250,
    height: 250,
  },
  scanCornerTL: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 52,
    height: 52,
    borderLeftWidth: 5,
    borderTopWidth: 5,
    borderColor: '#fff',
  },
  scanCornerTR: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 52,
    height: 52,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderColor: '#fff',
  },
  scanCornerBL: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 52,
    height: 52,
    borderLeftWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#fff',
  },
  scanCornerBR: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 52,
    height: 52,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#fff',
  },
  scannerHelp: {
    position: 'absolute',
    bottom: 54,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    padding: 14,
  },
  scannerHelpTxt: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalAvatarTxt: { fontSize: 28, fontWeight: '900', color: GREEN },
  modalNombre: { fontSize: 18, fontWeight: '900', color: GREEN_DARK, textAlign: 'center' },
  modalMat: { fontSize: 14, color: '#7A8A7A', marginTop: 4 },
  modalMeta: { fontSize: 13, color: '#A0AAA0', marginTop: 2 },
  modalEstado: { borderRadius: 12, padding: 12, marginTop: 14, width: '100%' },
  modalEstadoTxt: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  modalCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDEBDD',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#F4F8F4',
  },
  modalCancelarTxt: { color: '#666', fontWeight: '800' },
  modalConfirmar: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalConfirmarTxt: { color: '#fff', fontWeight: '900' },

  vehiculosBox: { width: '100%', marginTop: 10, marginBottom: 2 },
  vehiculosLabel: {
    fontSize: 11,
    color: '#7A8A7A',
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehiculoChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDEBDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    backgroundColor: '#FAFCFA',
  },
  vehiculoChipSel: { borderColor: GREEN, backgroundColor: GREEN_LIGHT },
  vehiculoChipTxt: { fontSize: 13, color: '#555', flex: 1 },

  // Foto de identidad (selfie)
  modalAvatarImg: {
    width: 88, height: 88, borderRadius: 44,
    marginBottom: 12, borderWidth: 2, borderColor: GREEN_LIGHT,
  },

  // Botón y formulario de vehículo adicional
  btnOtroVeh: {
    borderWidth: 1, borderColor: GREEN, borderRadius: 10,
    paddingVertical: 9, alignItems: 'center', marginTop: 8,
    borderStyle: 'dashed',
  },
  btnOtroVehTxt: { color: GREEN, fontWeight: '700', fontSize: 13 },
  formVehBox: {
    backgroundColor: '#F4F8F4', borderRadius: 12, padding: 12,
    marginTop: 8, width: '100%', borderWidth: 0.5, borderColor: '#DDEBDD',
  },
  formVehTitulo: { fontSize: 13, fontWeight: '800', color: GREEN_DARK, marginBottom: 8 },
  formVehInput: {
    borderWidth: 1, borderColor: '#DDEBDD', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9, fontSize: 14,
    color: '#333', backgroundColor: '#fff', marginBottom: 8,
  },
  tipoRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tipoBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    borderColor: '#DDEBDD', backgroundColor: '#fff', alignItems: 'center',
  },
  tipoBtnSel: { borderColor: GREEN, backgroundColor: GREEN_LIGHT },
  tipoBtnTxt: { fontSize: 12, color: '#888', fontWeight: '600' },
  tipoBtnTxtSel: { color: GREEN, fontWeight: '700' },
  errorVeh: { color: '#C62828', fontSize: 12, marginBottom: 8 },
  btnVehCancelar: {
    flex: 1, borderWidth: 1, borderColor: '#DDEBDD', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center', backgroundColor: '#fff',
  },
  btnVehCancelarTxt: { color: '#666', fontWeight: '700', fontSize: 13 },
  btnVehGuardar: {
    flex: 2, backgroundColor: GREEN, borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  btnVehGuardarTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
});