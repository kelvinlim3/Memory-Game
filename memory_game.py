from flask import Flask, render_template
import random

# ============================================================================
# APPLICATION SETUP
# ============================================================================

app = Flask(__name__)

# ============================================================================
# GAME CONFIGURATION
# ============================================================================

MOST_POPULAR_EMOJIS: list[str] = [
    "😂", "❤️", "👍", "☕️", "💯", "🙏", 
    "😎", "🥰", "😱", "⭐️", "👏", "🔥"
]

LEAST_POPULAR_EMOJIS: list[str] = [
    "🦄", "🦖", "🧱", "🪐", "🎩", "🧯", 
    "🐙", "👒", "🕰️", "🎷", "🥬", "🍲"
]

BOARD_ROWS: int = 4
BOARD_COLS: int = 4

# ============================================================================
# GAME LOGIC
# ============================================================================

def generate_board(
    num_rows: int = BOARD_ROWS, 
    num_cols: int = BOARD_COLS
) -> list[str]:
    """
    Generate a shuffled memory game board with paired emojis.
    
    Args:
        num_rows: Number of rows in the board (default: 4)
        num_cols: Number of columns in the board (default: 4)
    
    Returns:
        A list of emoji strings representing the shuffled board
    """
    rng = random.Random()
    
    num_cards = num_rows * num_cols
    num_pairs = num_cards // 2
    
    emoji_pool = MOST_POPULAR_EMOJIS + LEAST_POPULAR_EMOJIS
    emojis = rng.sample(emoji_pool, num_pairs)
    
    cards = emojis * 2
    rng.shuffle(cards)
    
    return cards

# ============================================================================
# ROUTES
# ============================================================================

@app.route("/")
def index():
    """Render the main game page with initial board."""
    cards = generate_board()
    return render_template("index.html", cards_json=cards)


@app.route("/new-board")
def new_board():
    """Generate and return a new shuffled board as JSON."""
    cards = generate_board()
    return cards

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    app.run()