import { useState } from 'react';
import { posterUrl } from '../api/tmdb';
import StarRating from './StarRating.jsx';
import './MovieCard.css';

export default function MovieCard({ movie, rating, onRate, showRating = true }) {
  const [imgError, setImgError] = useState(false);
  const year = movie.release_date?.slice(0, 4);
  const poster = posterUrl(movie.poster_path, 'w500');

  return (
    <div className="movie-card">
      <div className="movie-card__poster-wrap">
        {poster && !imgError ? (
          <img
            className="movie-card__poster"
            src={poster}
            alt={`${movie.title} poster`}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="movie-card__poster-fallback">{movie.title}</div>
        )}
        <div className="movie-card__gradient" />
        <div className="movie-card__meta">
          <h3 className="movie-card__title">{movie.title}</h3>
          <div className="movie-card__sub mono">
            {year && <span>{year}</span>}
            {movie.runtime ? <span>{movie.runtime} min</span> : null}
            {movie.vote_average ? <span>{movie.vote_average.toFixed(1)}★ TMDB</span> : null}
          </div>
        </div>
      </div>
      {showRating && (
        <div className="movie-card__body">
          <span className="movie-card__prompt">
            {rating ? "you rated it" : "seen it? rate it"}
          </span>
          <StarRating value={rating || 0} onRate={(n) => onRate?.(movie, n)} />
        </div>
      )}
    </div>
  );
}
