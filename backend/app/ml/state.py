# Global state — models are trained once at startup and stored here
# Routes import this module to access them
recommender = None
movies_df   = None
ratings_df  = None
links_df    = None
genre_df    = None
