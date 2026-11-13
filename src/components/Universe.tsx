import { useUniverse, type UniverseProps } from '@/hooks';

const Universe = (props: UniverseProps) => {
  const { host, error, reset } = useUniverse(props);

  return (
    <div className="universe" ref={host}>
      {error && (
        <div className="webgl-fallback">
          3D is unavailable on this device. Explore every genre with All worlds.
        </div>
      )}
      <button
        className="reset-view"
        onClick={() => reset.current()}
        aria-label="Reset camera"
      >
        Reset view
      </button>
    </div>
  );
};

export default Universe;
