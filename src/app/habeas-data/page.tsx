import Link from "next/link";

export const metadata = {
  title: "Política de Habeas Data | CAVALTEC",
};

export default function HabeasDataPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0d1f33 0%, #1a3a5c 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(13,31,51,0.9)" }}>
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al inicio
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <img src="/logo_blanco.png" alt="CAVALTEC" className="h-7 w-auto object-contain" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Title */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 text-cavaltec-gold text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-cavaltec-gold" />
            Protección de datos personales
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Política de Tratamiento de<br />
            <span className="text-cavaltec-gold">Datos Personales</span>
          </h1>
          <p className="text-slate-400 mt-3 text-sm">
            De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013, CAVALTEC informa su política de tratamiento de datos.
          </p>
          <p className="text-slate-500 text-xs mt-2">Última actualización: junio de 2026</p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8">

          <Section title="1. Responsable del tratamiento">
            <p><strong className="text-white">CAVALTEC Cybersecurity</strong> — empresa colombiana dedicada a la consultoría y auditoría en seguridad de la información.</p>
            <p className="mt-2">Correo de contacto: <span className="text-cavaltec-gold">datos@cavaltec.co</span></p>
          </Section>

          <Section title="2. Finalidad del tratamiento">
            <ul className="list-none flex flex-col gap-2">
              {[
                "Gestión de la cuenta del usuario y autenticación mediante proveedores OAuth (Microsoft, Google, GitHub).",
                "Prestación del servicio de auditoría automatizada de cumplimiento normativo Ley 1581.",
                "Generación de informes de diagnóstico y planes de mitigación de riesgos.",
                "Comunicaciones relacionadas con el servicio, actualizaciones y soporte técnico.",
                "Atención de peticiones, quejas, reclamos y sugerencias (PQRS).",
                "Cumplimiento de obligaciones legales y regulatorias aplicables.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-cavaltec-gold/20 text-cavaltec-gold flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="3. Datos que recopilamos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cat: "Identificación", items: "Nombre, correo electrónico, foto de perfil (del proveedor OAuth)" },
                { cat: "Empresa", items: "Nombre de la empresa, NIT, sector económico" },
                { cat: "Diagnóstico", items: "Respuestas al cuestionario de auditoría, justificaciones y planes de acción" },
                { cat: "Técnicos", items: "Dirección IP, tipo de navegador, fecha y hora de acceso (para seguridad)" },
              ].map((d) => (
                <div key={d.cat} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-cavaltec-gold text-xs font-bold uppercase tracking-wide mb-1">{d.cat}</p>
                  <p className="text-slate-300 text-sm">{d.items}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Derechos del titular (Art. 8 Ley 1581)">
            <p className="text-slate-300 text-sm mb-4">Como titular de sus datos personales, usted tiene derecho a:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ["Conocer", "Saber qué datos suyos tenemos y para qué los usamos."],
                ["Actualizar", "Corregir datos incompletos o inexactos."],
                ["Rectificar", "Solicitar la corrección de información errónea."],
                ["Suprimir", "Pedir la eliminación de sus datos cuando no sea legal o necesario mantenerlos."],
                ["Revocar", "Retirar el consentimiento otorgado en cualquier momento."],
                ["Acceder", "Obtener una copia de sus datos personales tratados."],
              ].map(([right, desc]) => (
                <div key={right} className="flex items-start gap-2 text-sm">
                  <span className="text-cavaltec-gold font-bold mt-0.5">→</span>
                  <span className="text-slate-300"><strong className="text-white">{right}:</strong> {desc}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Para ejercer estos derechos, envíe su solicitud a <span className="text-cavaltec-gold">datos@cavaltec.co</span> con asunto "Derechos ARCO". Responderemos en un plazo máximo de 15 días hábiles.
            </p>
          </Section>

          <Section title="5. Bases legales del tratamiento">
            <p className="text-slate-300 text-sm">El tratamiento se fundamenta en:</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
              <li>• <strong className="text-white">Consentimiento:</strong> otorgado por el usuario al aceptar esta política y usar el servicio.</li>
              <li>• <strong className="text-white">Relación contractual:</strong> necesario para prestar el servicio de auditoría solicitado.</li>
              <li>• <strong className="text-white">Obligación legal:</strong> cumplimiento de normas de seguridad de la información y registro de auditorías.</li>
            </ul>
          </Section>

          <Section title="6. Transferencia y transmisión de datos">
            <p className="text-slate-300 text-sm">
              Sus datos se almacenan en <strong className="text-white">Supabase</strong> (infraestructura en la nube con cifrado en tránsito y reposo). No vendemos, arrendamos ni cedemos sus datos personales a terceros con fines comerciales. La autenticación se realiza mediante los proveedores OAuth que usted elige (Microsoft, Google o GitHub), sujetos a sus propias políticas de privacidad.
            </p>
          </Section>

          <Section title="7. Tiempo de conservación">
            <p className="text-slate-300 text-sm">
              Conservamos sus datos mientras mantenga una cuenta activa en CAVALTEC. Tras la eliminación de la cuenta, los datos se anonimizarán o eliminarán en un plazo máximo de 30 días calendario, salvo obligación legal de conservarlos por más tiempo.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p className="text-slate-300 text-sm">
              Implementamos medidas técnicas y administrativas para proteger sus datos: cifrado TLS en tránsito, cifrado AES-256 en reposo, control de acceso por roles, autenticación OAuth 2.0 y registros de auditoría. En caso de una vulneración de seguridad, notificaremos a los titulares afectados y a la SIC dentro de los plazos legales establecidos.
            </p>
          </Section>

          <Section title="9. Modificaciones a esta política">
            <p className="text-slate-300 text-sm">
              CAVALTEC podrá actualizar esta política en cualquier momento. Los cambios significativos serán notificados a través del correo registrado o mediante aviso en la plataforma con al menos 10 días de anticipación.
            </p>
          </Section>

          <Section title="10. Autoridad de control">
            <p className="text-slate-300 text-sm">
              Si considera que sus derechos no han sido atendidos, puede presentar una queja ante la <strong className="text-white">Superintendencia de Industria y Comercio (SIC)</strong> en{" "}
              <span className="text-cavaltec-gold">www.sic.gov.co</span>.
            </p>
          </Section>

          {/* Accept block */}
          <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.25)" }}>
            <p className="text-white font-semibold mb-1">¿Listo para continuar?</p>
            <p className="text-slate-400 text-sm mb-4">Al iniciar sesión, confirmas que has leído y aceptas esta política de tratamiento de datos.</p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-xl font-bold text-sm text-cavaltec-dark transition-all hover:scale-[1.02]"
              style={{ background: "#f0b429" }}
            >
              Volver al inicio de sesión →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h2 className="text-white font-bold text-lg mb-4">{title}</h2>
      <div className="text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}
