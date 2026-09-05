import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Course, CourseModality } from '../../types';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  courseToEdit
}) => {
  const { addCourse, updateCourse, settings } = useData();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Aduanas');
  const [price, setPrice] = useState(6500);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [durationHours, setDurationHours] = useState(60);
  const [modality, setModality] = useState<CourseModality>('Presencial');
  const [status, setStatus] = useState<Course['status']>('Inscripciones abiertas');
  const [syllabus, setSyllabus] = useState('');
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    if (courseToEdit) {
      setCode(courseToEdit.code);
      setName(courseToEdit.name);
      setDescription(courseToEdit.description);
      setCategory(courseToEdit.category);
      setPrice(courseToEdit.price);
      setDurationWeeks(courseToEdit.durationWeeks);
      setDurationHours(courseToEdit.durationHours);
      setModality(courseToEdit.modality);
      setStatus(courseToEdit.status);
      setSyllabus(courseToEdit.syllabus ? courseToEdit.syllabus.join('\n') : '');
      setRequirements(courseToEdit.requirements ? courseToEdit.requirements.join('\n') : '');
    } else {
      setCode('ADU-');
      setName('');
      setDescription('');
      setCategory('Aduanas');
      setPrice(6500);
      setDurationWeeks(8);
      setDurationHours(60);
      setModality('Presencial');
      setStatus('Inscripciones abiertas');
      setSyllabus('Módulo 1: Introducción a la Legislación Aduanera\nMódulo 2: Clasificación Arancelaria y Nomenclatura\nMódulo 3: Liquidación de Impuestos y DAU');
      setRequirements('Título de Educación Media o Universitaria\nFotocopia de DNI');
    }
  }, [courseToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const syllabusArray = syllabus.split('\n').filter(s => s.trim().length > 0);
    const reqArray = requirements.split('\n').filter(r => r.trim().length > 0);

    if (courseToEdit) {
      await updateCourse(courseToEdit.id, {
        code,
        name,
        description,
        category,
        price,
        durationWeeks,
        durationHours,
        modality,
        status,
        syllabus: syllabusArray,
        requirements: reqArray
      });
    } else {
      await addCourse({
        code,
        name,
        description,
        category,
        price,
        durationWeeks,
        durationHours,
        modality,
        status,
        syllabus: syllabusArray,
        requirements: reqArray
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              {courseToEdit ? 'Modificar Curso' : 'Registrar Nuevo Curso Aduanero'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código del Curso *</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ej: ADU-101"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nombre del Curso *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej: Legislación y Procedimientos Aduaneros de Honduras"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Aduanas">Aduanas</option>
                <option value="Clasificación Arancelaria">Clasificación Arancelaria</option>
                <option value="Comercio Exterior">Comercio Exterior</option>
                <option value="Logística Internacional">Logística Internacional</option>
                <option value="Certificaciones">Certificaciones</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Precio / Matrícula ({settings.currencySymbol})</label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Modalidad</label>
              <select
                value={modality}
                onChange={e => setModality(e.target.value as CourseModality)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duración (Semanas)</label>
              <input
                type="number"
                value={durationWeeks}
                onChange={e => setDurationWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Horas Académicas</label>
              <input
                type="number"
                value={durationHours}
                onChange={e => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estado</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
              >
                <option value="Inscripciones abiertas">Inscripciones abiertas</option>
                <option value="En curso">En curso</option>
                <option value="Planificado">Planificado</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Descripción del Programa</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Resumen del contenido y alcance profesional..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Temario / Módulos (Uno por línea)</label>
              <textarea
                rows={3}
                value={syllabus}
                onChange={e => setSyllabus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Requisitos de Ingreso (Uno por línea)</label>
              <textarea
                rows={2}
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Curso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
