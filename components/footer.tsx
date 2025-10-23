export default function Footer() {
  return (
    <div className="mt-16 text-center text-slate-400 text-sm">
      <p>
        Powered by{' '}
        <a
          href="https://railway.app"
          className="underline hover:text-purple-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Railway
        </a>{' '}
        • Made with <span className="text-pink-500">♥</span> by{' '}
        <a
          href="https://x.com/charlesvien"
          className="underline hover:text-purple-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Charles
        </a>{' '}
        •{' '}
        <a
          href="https://github.com/charlesvien/game-nite"
          className="underline hover:text-purple-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Source
        </a>
      </p>
    </div>
  );
}
