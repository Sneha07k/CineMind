export const GENRE_COLORS = {
  Action:      '#e25c5c',
  Comedy:      '#e2b04a',
  Drama:       '#5c8ae2',
  Horror:      '#a05ce2',
  Romance:     '#e25ca0',
  'Sci-Fi':    '#5ce2d4',
  Thriller:    '#e27a5c',
  Animation:   '#5ce27a',
  Documentary: '#8a8795',
  Fantasy:     '#c45ce2',
}

export const genreColor = (genre) => GENRE_COLORS[genre] || '#8a8795'
