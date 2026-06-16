type Props = {
  color?: "#00B2A9" | "#fce300";
  width?: number;
  padding?: number;
  showLoadingText?: boolean;
  loadingText?: string;
};

export const Spinner = ({
  color = "#00B2A9",
  width = 24,
  padding = width / 8,
  showLoadingText = false,
  loadingText = "Loading...",
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className="spinner"
        style={{
          background: color,
          width: `${width}px`,
          padding: `${padding}px`,
        }}
      />
      {showLoadingText && (
        <p className=" text-xxs text-gray-700">{loadingText}</p>
      )}
    </div>
  );
};
