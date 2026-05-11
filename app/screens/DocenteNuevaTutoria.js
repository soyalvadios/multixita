import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMisAsignacionesDocente, crearTutoria, getAlumnosGrupo } from '../services/api';

const GREEN = '#2E7D32';

const PREGUNTAS_DEFAULT = [
  {
    pregunta: '¿Cómo calificarías tu rendimiento académico en esta materia?',
    opciones: [
      { texto: 'Excelente, voy al corriente con todo', valor: 10 },
      { texto: 'Bien, aunque con algunas dudas', valor: 8 },
      { texto: 'Regular, me cuesta pero sigo adelante', valor: 5 },
      { texto: 'Mal, tengo dificultades importantes', valor: 2 },
    ],
  },
  {
    pregunta: '¿Asistes regularmente a clases?',
    opciones: [
      { texto: 'Siempre, no falto casi nunca', valor: 10 },
      { texto: 'Casi siempre, falto muy poco', valor: 7 },
      { texto: 'A veces, falto con cierta frecuencia', valor: 4 },
      { texto: 'Poco, falto bastante', valor: 1 },
    ],
  },
  {
    pregunta: '¿Cumples con tareas y trabajos a tiempo?',
    opciones: [
      { texto: 'Siempre o casi siempre', valor: 10 },
      { texto: 'La mayoría de las veces', valor: 7 },
      { texto: 'Solo a veces', valor: 4 },
      { texto: 'Casi nunca', valor: 1 },
    ],
  },
  {
    pregunta: '¿Tienes dificultades económicas que afecten tus estudios?',
    opciones: [
      { texto: 'No, estoy bien económicamente', valor: 10 },
      { texto: 'Leves dificultades, puedo resolverlo', valor: 7 },
      { texto: 'Sí, me afectan moderadamente', valor: 4 },
      { texto: 'Sí, es un problema grave para mí', valor: 1 },
    ],
  },
  {
    pregunta: '¿Cómo es tu situación emocional y motivación actualmente?',
    opciones: [
      { texto: 'Muy bien, motivado y enfocado', valor: 10 },
      { texto: 'Bien, aunque con algo de estrés', valor: 7 },
      { texto: 'Regular, algo desmotivado', valor: 4 },
      { texto: 'Mal, estoy muy estresado o desanimado', valor: 1 },
    ],
  },
];

export default function DocenteNuevaTutoria({ navigation }) {
  const { token, handleTokenExpired } = useAuth();

  const [asignaciones,   setAsignaciones]   = useState([]);
  const [loadingAsig,    setLoadingAsig]    = useState(true);
  const [asigSelected,   setAsigSelected]   = useState(null);
  const [alumnosGrupo,   setAlumnosGrupo]   = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [alumnosSel,     setAlumnosSel]     = useState([]);
  const [modoSeleccion,  setModoSeleccion]  = useState('todos');
  const [titulo,         setTitulo]         = useState('');
  const [motivo,         setMotivo]         = useState('');
  const [instrucciones,  setInstrucciones]  = useState('');
  const [parcial,        setParcial]        = useState('1');
  const [preguntas,      setPreguntas]      = useState(() =>
    PREGUNTAS_DEFAULT.map(p => ({ ...p, opciones: p.opciones.map(o => ({ ...o })) }))
  );
  const [paso,     setPaso]     = useState(1);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    getMisAsignacionesDocente(token, handleTokenExpired)
      .then(d => setAsignaciones(Array.isArray(d) ? d : []))
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setLoadingAsig(false));
  }, []);

  const avanzarAPaso2 = async () => {
    if (!asigSelected) return;
    setLoadingAlumnos(true);
    try {
      const data = await getAlumnosGrupo(token, asigSelected.id_grupo, handleTokenExpired);
      setAlumnosGrupo(Array.isArray(data) ? data : []);
      setAlumnosSel([]);
      setModoSeleccion('todos');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingAlumnos(false);
    }
    setPaso(2);
  };

  const toggleAlumno = (id) =>
    setAlumnosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const renderPaso1 = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.pasoTitulo}>¿Para qué materia y grupo?</Text>
      <Text style={s.pasoSub}>Selecciona la asignación a la que pertenece esta tutoría.</Text>
      {loadingAsig ? <ActivityIndicator color={GREEN} style={{ marginTop: 24 }} /> :
       !asignaciones.length ? (
         <View style={s.vacioBox}>
           <Text style={s.vacioTxt}>No tienes asignaciones activas.</Text>
           <Text style={s.vacioSub}>Pide al administrador que te asigne una materia.</Text>
         </View>
       ) : asignaciones.map(a => (
         <TouchableOpacity key={a.id_asignacion}
           style={[s.asigCard, asigSelected?.id_asignacion === a.id_asignacion && s.asigCardSel]}
           onPress={() => setAsigSelected(a)}>
           <View style={s.asigTop}>
             <View style={s.tagMat}><Text style={s.tagMatTxt}>{a.clave_materia}</Text></View>
             <Text style={s.asigAlumnos}>{a.total_alumnos} alumnos</Text>
           </View>
           <Text style={s.asigNombre}>{a.materia}</Text>
           <Text style={s.asigMeta}>{a.grupo} · {a.periodo}</Text>
           {a.tutorias_activas > 0 && (
             <Text style={s.asigActivas}>{a.tutorias_activas} tutoría(s) activas</Text>
           )}
           {asigSelected?.id_asignacion === a.id_asignacion && (
             <Text style={s.checkSel}>✓ Seleccionada</Text>
           )}
         </TouchableOpacity>
       ))
      }
      <TouchableOpacity
        style={[s.btnSig, (!asigSelected || loadingAsig) && s.btnDisabled]}
        onPress={avanzarAPaso2}
        disabled={!asigSelected || loadingAsig}>
        <Text style={s.btnSigTxt}>Siguiente →</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPaso2 = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.pasoTitulo}>¿A quiénes va dirigida?</Text>
      <Text style={s.pasoSub}>{asigSelected?.materia} · {asigSelected?.grupo}</Text>
      <View style={s.modoRow}>
        <TouchableOpacity
          style={[s.modoBtn, modoSeleccion === 'todos' && s.modoBtnSel]}
          onPress={() => { setModoSeleccion('todos'); setAlumnosSel([]); }}>
          <Text style={[s.modoBtnTxt, modoSeleccion === 'todos' && s.modoBtnTxtSel]}>👥 Todo el grupo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modoBtn, modoSeleccion === 'especificos' && s.modoBtnSel]}
          onPress={() => setModoSeleccion('especificos')}>
          <Text style={[s.modoBtnTxt, modoSeleccion === 'especificos' && s.modoBtnTxtSel]}>🎯 Alumnos específicos</Text>
        </TouchableOpacity>
      </View>

      {modoSeleccion === 'todos' ? (
        <View style={s.todosBox}>
          <Text style={s.todosEmoji}>👥</Text>
          <Text style={s.todosTxt}>La tutoría se publicará a todos los</Text>
          <Text style={s.todosNum}>{alumnosGrupo.length} alumnos del grupo</Text>
          <Text style={s.todosSub}>{asigSelected?.grupo}</Text>
        </View>
      ) : (
        <>
          <View style={s.selAccionesRow}>
            <Text style={s.selConteo}>{alumnosSel.length} de {alumnosGrupo.length} seleccionados</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setAlumnosSel(alumnosGrupo.map(a => a.id_usuario))}>
                <Text style={s.selAccionTxt}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAlumnosSel([])}>
                <Text style={[s.selAccionTxt, { color: '#C62828' }]}>Ninguno</Text>
              </TouchableOpacity>
            </View>
          </View>
          {loadingAlumnos ? <ActivityIndicator color={GREEN} style={{ marginTop: 24 }} /> :
           alumnosGrupo.map(a => {
            const sel = alumnosSel.includes(a.id_usuario);
            return (
              <TouchableOpacity key={a.id_usuario}
                style={[s.alumnoItem, sel && s.alumnoItemSel]}
                onPress={() => toggleAlumno(a.id_usuario)} activeOpacity={0.75}>
                <View style={[s.alumnoAvatar, sel && s.alumnoAvatarSel]}>
                  <Text style={[s.alumnoAvatarTxt, sel && { color: '#fff' }]}>
                    {(a.nombre || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.alumnoNombre}>{a.apellido_paterno} {a.apellido_materno} {a.nombre}</Text>
                  <Text style={s.alumnoMat}>{a.matricula}</Text>
                </View>
                <View style={[s.checkBox, sel && s.checkBoxSel]}>
                  {sel && <Text style={s.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <View style={s.navRow}>
        <TouchableOpacity style={s.btnAtras} onPress={() => setPaso(1)}>
          <Text style={s.btnAtrasTxt}>‹ Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnSig, (modoSeleccion === 'especificos' && alumnosSel.length === 0) && s.btnDisabled]}
          onPress={() => {
            if (modoSeleccion === 'especificos' && alumnosSel.length === 0) {
              Alert.alert('Sin alumnos', 'Selecciona al menos un alumno o elige "Todo el grupo".');
              return;
            }
            setPaso(3);
          }}>
          <Text style={s.btnSigTxt}>Siguiente →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPaso3 = () => (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Text style={s.pasoTitulo}>Datos de la tutoría</Text>
      <Text style={s.pasoSub}>{asigSelected?.materia} · {asigSelected?.grupo}</Text>
      <View style={s.destBox}>
        <Text style={s.destTxt}>
          {modoSeleccion === 'todos'
            ? `📣 Todo el grupo (${alumnosGrupo.length} alumnos)`
            : `🎯 ${alumnosSel.length} alumno${alumnosSel.length !== 1 ? 's' : ''} seleccionado${alumnosSel.length !== 1 ? 's' : ''}`}
        </Text>
      </View>
      <Text style={s.label}>Título *</Text>
      <TextInput style={s.input} value={titulo} onChangeText={setTitulo}
        placeholder="Ej. Tutoría Parcial 1 — Seguimiento académico" placeholderTextColor="#aaa"
        multiline maxLength={200} />
      <Text style={s.label}>Parcial</Text>
      <View style={s.parcialesRow}>
        {['1','2','3'].map(p => (
          <TouchableOpacity key={p} style={[s.parcialBtn, parcial===p && s.parcialBtnSel]} onPress={() => setParcial(p)}>
            <Text style={[s.parcialBtnTxt, parcial===p && s.parcialBtnTxtSel]}>Parcial {p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.label}>Motivo / contexto</Text>
      <TextInput style={[s.input, s.inputArea]} value={motivo} onChangeText={setMotivo}
        placeholder="Describe el objetivo principal de esta tutoría..." placeholderTextColor="#aaa"
        multiline numberOfLines={3} textAlignVertical="top" />
      <Text style={s.label}>Instrucciones para el alumno</Text>
      <TextInput style={[s.input, s.inputArea]} value={instrucciones} onChangeText={setInstrucciones}
        placeholder="Instrucciones que verá el alumno antes de responder..." placeholderTextColor="#aaa"
        multiline numberOfLines={3} textAlignVertical="top" />
      <View style={s.navRow}>
        <TouchableOpacity style={s.btnAtras} onPress={() => setPaso(2)}>
          <Text style={s.btnAtrasTxt}>‹ Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnSig, !titulo.trim() && s.btnDisabled]}
          onPress={() => titulo.trim() && setPaso(4)} disabled={!titulo.trim()}>
          <Text style={s.btnSigTxt}>Preguntas →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const addPregunta = () => {
    if (preguntas.length >= 10) return Alert.alert('Límite', 'Máximo 10 preguntas.');
    setPreguntas(prev => [...prev, {
      pregunta: '',
      opciones: [{ texto: '', valor: 10 },{ texto: '', valor: 7 },{ texto: '', valor: 4 },{ texto: '', valor: 1 }],
    }]);
  };

  const enviar = async (estatus = 'publicada') => {
    const invalidas = preguntas.filter(p => !p.pregunta.trim() || p.opciones.some(o => !o.texto.trim()));
    if (invalidas.length) return Alert.alert('Preguntas incompletas', 'Completa texto de preguntas y opciones.');
    setEnviando(true);
    try {
      const alumnos_seleccionados = modoSeleccion === 'especificos' ? alumnosSel : [];
      const result = await crearTutoria(token, {
        id_asignacion: asigSelected.id_asignacion,
        parcial: parseInt(parcial),
        titulo: titulo.trim(),
        motivo: motivo.trim() || null,
        instrucciones: instrucciones.trim() || null,
        preguntas,
        estatus,
        alumnos_seleccionados,
      }, handleTokenExpired);
      Alert.alert(
        estatus === 'publicada' ? '✅ Tutoría publicada' : '✅ Borrador guardado',
        `Folio: ${result.folio}\n` +
        (estatus === 'publicada' ? `Alumnos notificados: ${result.alumnos_notificados}` : 'Puedes publicarla después desde tu lista'),
        [{ text: 'OK', onPress: () => navigation.replace('ListaTutorias') }]
      );
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setEnviando(false); }
  };

  const renderPaso4 = () => (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Text style={s.pasoTitulo}>Preguntas del cuestionario</Text>
      <Text style={s.pasoSub}>Cada pregunta tiene 4 opciones con valores de riesgo (10=sin riesgo, 1=riesgo alto).</Text>
      {preguntas.map((preg, pi) => (
        <View key={pi} style={s.pregCard}>
          <View style={s.pregCardTop}>
            <View style={s.tagNum}><Text style={s.tagNumTxt}>{pi + 1}</Text></View>
            <Text style={s.pregCardLabel}>Pregunta {pi + 1}</Text>
            {preguntas.length > 1 && (
              <TouchableOpacity onPress={() => setPreguntas(prev => prev.filter((_,i) => i !== pi))} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={s.removeBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput style={[s.input, s.inputPreg]} value={preg.pregunta}
            onChangeText={t => setPreguntas(prev => prev.map((p,i) => i===pi ? {...p, pregunta:t} : p))}
            placeholder="Escribe la pregunta aquí..." placeholderTextColor="#aaa"
            multiline textAlignVertical="top" />
          {preg.opciones.map((op, oi) => (
            <View key={oi} style={s.opcionRow}>
              <View style={[s.tagValor, { backgroundColor: op.valor >= 8 ? '#E8F5E9' : op.valor >= 5 ? '#FFF8E1' : '#FFEBEE' }]}>
                <Text style={[s.tagValorTxt, { color: op.valor >= 8 ? GREEN : op.valor >= 5 ? '#E65100' : '#C62828' }]}>{op.valor}</Text>
              </View>
              <TextInput style={s.opInput} value={op.texto}
                onChangeText={t => setPreguntas(prev => prev.map((p,pidx) => pidx !== pi ? p : {
                  ...p, opciones: p.opciones.map((o,oidx) => oidx !== oi ? o : {...o, texto:t})
                }))}
                placeholder={`Opción ${oi+1}`} placeholderTextColor="#bbb" />
            </View>
          ))}
        </View>
      ))}
      {preguntas.length < 10 && (
        <TouchableOpacity style={s.btnAddPreg} onPress={addPregunta}>
          <Text style={s.btnAddPregTxt}>+ Agregar pregunta</Text>
        </TouchableOpacity>
      )}
      <View style={s.navRow}>
        <TouchableOpacity style={s.btnAtras} onPress={() => setPaso(3)}>
          <Text style={s.btnAtrasTxt}>‹ Atrás</Text>
        </TouchableOpacity>
        <View style={{ gap: 6 }}>
          <TouchableOpacity style={[s.btnSig, enviando && s.btnDisabled]} onPress={() => enviar('publicada')} disabled={enviando}>
            {enviando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnSigTxt}>Publicar ✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnBorrador, enviando && s.btnDisabled]} onPress={() => enviar('borrador')} disabled={enviando}>
            <Text style={s.btnBorradorTxt}>Guardar borrador</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => paso > 1 ? setPaso(p => p-1) : navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={s.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Nueva tutoría</Text>
        <View style={s.stepsRow}>
          {[1,2,3,4].map(n => (
            <View key={n} style={[s.stepDot, paso >= n && s.stepDotActivo]}>
              <Text style={[s.stepDotTxt, paso >= n && s.stepDotTxtActivo]}>{n}</Text>
            </View>
          ))}
        </View>
      </View>
      {paso === 1 && renderPaso1()}
      {paso === 2 && renderPaso2()}
      {paso === 3 && renderPaso3()}
      {paso === 4 && renderPaso4()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:'#f5f5f5'},
  header:{backgroundColor:GREEN,paddingTop:52,paddingBottom:14,paddingHorizontal:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  headerBack:{color:'#fff',fontSize:26,fontWeight:'300',lineHeight:28},
  headerTitulo:{color:'#fff',fontSize:17,fontWeight:'700'},
  stepsRow:{flexDirection:'row',gap:5},
  stepDot:{width:22,height:22,borderRadius:11,backgroundColor:'rgba(255,255,255,0.25)',alignItems:'center',justifyContent:'center'},
  stepDotActivo:{backgroundColor:'#fff'},
  stepDotTxt:{color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:'700'},
  stepDotTxtActivo:{color:GREEN},
  scroll:{padding:16,paddingBottom:40},
  pasoTitulo:{fontSize:18,fontWeight:'700',color:'#1B5E20',marginBottom:4},
  pasoSub:{fontSize:13,color:'#888',marginBottom:16,lineHeight:18},
  label:{fontSize:12,fontWeight:'600',color:'#558B2F',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6,marginTop:14},
  input:{borderWidth:1,borderColor:'#ddd',borderRadius:12,padding:12,fontSize:14,color:'#333',backgroundColor:'#fff',marginBottom:4},
  inputArea:{minHeight:80,textAlignVertical:'top'},
  inputPreg:{minHeight:70,textAlignVertical:'top',marginBottom:10},
  modoRow:{flexDirection:'row',gap:10,marginBottom:16},
  modoBtn:{flex:1,paddingVertical:11,borderRadius:12,borderWidth:1,borderColor:'#ddd',backgroundColor:'#fff',alignItems:'center'},
  modoBtnSel:{borderColor:GREEN,backgroundColor:'#F1F8E9'},
  modoBtnTxt:{fontSize:12,color:'#888',fontWeight:'600'},
  modoBtnTxtSel:{color:GREEN,fontWeight:'700'},
  todosBox:{alignItems:'center',backgroundColor:'#F1F8E9',borderRadius:14,padding:24,borderWidth:1,borderColor:'#C8E6C9',marginBottom:16},
  todosEmoji:{fontSize:36,marginBottom:8},
  todosTxt:{fontSize:14,color:'#558B2F',textAlign:'center'},
  todosNum:{fontSize:22,fontWeight:'800',color:'#1B5E20',marginTop:4},
  todosSub:{fontSize:13,color:'#888',marginTop:2},
  selAccionesRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  selConteo:{fontSize:13,color:'#558B2F',fontWeight:'600'},
  selAccionTxt:{fontSize:12,color:GREEN,fontWeight:'700'},
  alumnoItem:{backgroundColor:'#fff',borderRadius:12,padding:12,marginBottom:8,flexDirection:'row',alignItems:'center',gap:12,borderWidth:0.5,borderColor:'#e0e0e0'},
  alumnoItemSel:{borderColor:GREEN,borderWidth:1.5,backgroundColor:'#F1F8E9'},
  alumnoAvatar:{width:40,height:40,borderRadius:20,backgroundColor:'#f0f0f0',alignItems:'center',justifyContent:'center'},
  alumnoAvatarSel:{backgroundColor:GREEN},
  alumnoAvatarTxt:{fontSize:16,fontWeight:'800',color:'#aaa'},
  alumnoNombre:{fontSize:13,fontWeight:'700',color:'#333'},
  alumnoMat:{fontSize:11,color:'#888',marginTop:2},
  checkBox:{width:24,height:24,borderRadius:6,borderWidth:1.5,borderColor:'#ddd',alignItems:'center',justifyContent:'center',backgroundColor:'#f5f5f5'},
  checkBoxSel:{backgroundColor:GREEN,borderColor:GREEN},
  checkMark:{color:'#fff',fontSize:13,fontWeight:'800'},
  destBox:{backgroundColor:'#E8F5E9',borderRadius:10,padding:10,marginBottom:8,borderWidth:1,borderColor:'#C8E6C9'},
  destTxt:{fontSize:13,color:'#1B5E20',fontWeight:'600'},
  parcialesRow:{flexDirection:'row',gap:8,marginBottom:4},
  parcialBtn:{flex:1,paddingVertical:10,borderRadius:10,borderWidth:1,borderColor:'#ddd',backgroundColor:'#fff',alignItems:'center'},
  parcialBtnSel:{borderColor:GREEN,backgroundColor:'#F1F8E9'},
  parcialBtnTxt:{color:'#888',fontWeight:'600'},
  parcialBtnTxtSel:{color:GREEN,fontWeight:'700'},
  navRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:20},
  btnAtras:{borderWidth:1,borderColor:'#ddd',borderRadius:12,paddingVertical:12,paddingHorizontal:18,backgroundColor:'#fff'},
  btnAtrasTxt:{color:'#555',fontWeight:'600'},
  btnSig:{backgroundColor:GREEN,borderRadius:12,paddingVertical:12,paddingHorizontal:22,alignItems:'center'},
  btnSigTxt:{color:'#fff',fontWeight:'700'},
  btnDisabled:{backgroundColor:'#A5D6A7'},
  btnBorrador:{borderWidth:1.5,borderColor:GREEN,borderRadius:12,paddingVertical:10,paddingHorizontal:18,alignItems:'center'},
  btnBorradorTxt:{color:GREEN,fontWeight:'600',fontSize:13},
  asigCard:{backgroundColor:'#fff',borderRadius:14,padding:14,marginBottom:10,borderWidth:0.5,borderColor:'#e0e0e0'},
  asigCardSel:{borderColor:GREEN,borderWidth:1.5,backgroundColor:'#F1F8E9'},
  asigTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},
  tagMat:{backgroundColor:'#1B5E20',borderRadius:6,paddingHorizontal:8,paddingVertical:3},
  tagMatTxt:{color:'#fff',fontSize:11,fontWeight:'700',letterSpacing:0.5},
  asigAlumnos:{fontSize:12,color:'#888'},
  asigNombre:{fontSize:15,fontWeight:'700',color:'#333'},
  asigMeta:{fontSize:12,color:'#888',marginTop:3},
  asigActivas:{fontSize:12,color:'#F57F17',marginTop:4},
  checkSel:{fontSize:13,color:GREEN,fontWeight:'700',marginTop:6},
  vacioBox:{alignItems:'center',paddingVertical:32},
  vacioTxt:{fontSize:15,color:'#555',fontWeight:'600'},
  vacioSub:{fontSize:13,color:'#aaa',marginTop:6,textAlign:'center'},
  pregCard:{backgroundColor:'#fff',borderRadius:14,padding:14,marginBottom:12,borderWidth:0.5,borderColor:'#e0e0e0'},
  pregCardTop:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  tagNum:{width:24,height:24,borderRadius:12,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},
  tagNumTxt:{color:'#fff',fontSize:12,fontWeight:'800'},
  pregCardLabel:{flex:1,fontSize:13,color:'#558B2F',fontWeight:'600'},
  removeBtn:{color:'#C62828',fontSize:16,fontWeight:'700'},
  opcionRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  tagValor:{width:32,height:32,borderRadius:8,alignItems:'center',justifyContent:'center',borderWidth:0.5,borderColor:'#ddd'},
  tagValorTxt:{fontSize:12,fontWeight:'800'},
  opInput:{flex:1,borderWidth:1,borderColor:'#e0e0e0',borderRadius:8,paddingHorizontal:10,paddingVertical:8,fontSize:13,color:'#333',backgroundColor:'#fafafa'},
  btnAddPreg:{borderWidth:1.5,borderColor:GREEN,borderRadius:12,paddingVertical:12,alignItems:'center',marginTop:4,marginBottom:16,borderStyle:'dashed'},
  btnAddPregTxt:{color:GREEN,fontWeight:'700',fontSize:14},
});
