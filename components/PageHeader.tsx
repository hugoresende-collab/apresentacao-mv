interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
}

export function PageHeader({ titulo, subtitulo }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#214B63]">{titulo}</h1>
      {subtitulo && <p className="text-sm text-gray-600 mt-1">{subtitulo}</p>}
    </div>
  );
}
