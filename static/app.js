// ============================================================================
// GAME STATE
// ============================================================================

let cards;
let first_card;
let lock_board;

let moves;
let total_time;
let timer_id;
let score;

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const board = document.getElementById("board");
const player_alias = document.getElementById("player-alias");
const moves_count = document.getElementById("moves-count");
const time_elapsed = document.getElementById("time-elapsed");
const surrogate_score = document.getElementById("surrogate-score");
const reset_button = document.getElementById("reset-button");

const celebrate_sound = new Audio(CELEBRATE_SOUND_URL);
celebrate_sound.volume = 0.4;

// ============================================================================
// GAME INITIALISATION
// ============================================================================

function initialise_game(initial_cards) {
    cards = initial_cards;
    
    reset_game_state();
    reset_ui();
    render_board();
}

function reset_game_state() {
    moves = 0;
    total_time = 0;
    timer_id = null;
    score = 0;
    first_card = null;
    lock_board = false;
}

function reset_ui() {
    board.innerHTML = "";
    moves_count.textContent = "0";
    time_elapsed.textContent = "0.00";
    surrogate_score.textContent = "0";
    player_alias.value = "";
    player_alias.readOnly = false;
    reset_button.classList.remove("probing");
}

function render_board() {
    cards.forEach((emoji, index) => {
        const card = create_card(emoji, index);
        board.appendChild(card);
    });
}

function create_card(emoji, index) {
    const card = document.createElement("div");
    card.className = "card hidden";
    card.textContent = emoji;
    card.dataset.index = index;
    card.dataset.emoji = emoji;
    card.addEventListener("click", on_click_card);
    return card;
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function on_click_card(e) {
    const card = e.currentTarget;

    if (should_ignore_click(card)) return;

    lock_player_alias_on_first_click();
    flip_card(card);
    start_timer();

    if (is_first_card_selection()) {
        first_card = card;
        return;
    }

    increment_moves();
    handle_card_match(card);
}

function should_ignore_click(card) {
    // ignore clicks if the board is locked or the card is already revealed
    return lock_board || !card.classList.contains("hidden");
}

function lock_player_alias_on_first_click() {
    if (first_card === null && moves === 0) {
        if (!player_alias.value) {
            player_alias.value = " ";
        }
        player_alias.readOnly = true;
    }
}

function is_first_card_selection() {
    return first_card === null;
}

function handle_card_match(card) {
    const match = first_card.dataset.emoji === card.dataset.emoji;

    if (match) {
        reveal_matched_cards(card);
        check_game_completion();
    } else {
        handle_mismatch(card);
    }
}

function reveal_matched_cards(card) {
    first_card.classList.add("revealed");
    card.classList.add("revealed");
    // reset first_card for next selection
    first_card = null;
}

function handle_mismatch(card) {
    // lock the board during the flip back animation
    lock_board = true;

    setTimeout(() => {
        flip_card(first_card);
        flip_card(card);
        // reset for next selection
        first_card = null;
        // unlock the board
        lock_board = false;
    }, 400);
}

function check_game_completion() {
    if (all_cards_revealed()) {
        lock_board = true;
        clearInterval(timer_id);
        celebrate(score);
    }
}

function flip_card(card) {
    card.classList.toggle("hidden");
    card.classList.toggle("flipped");
}

function increment_moves() {
    moves += 1;
    moves_count.textContent = moves;
}

function all_cards_revealed() {
    return document.querySelectorAll(".card.hidden").length === 0;
}

// ============================================================================
// TIMER
// ============================================================================

function start_timer() {
    // prevent multiple timers
    if (timer_id !== null) return;

    const start_time = performance.now();

    timer_id = setInterval(() => {
        const seconds = (performance.now() - start_time) / 1000;
        time_elapsed.textContent = seconds.toFixed(2);
        // update total_time and score
        score = moves * seconds;
        surrogate_score.textContent = score.toFixed(0);
    }, 70);
}

// ============================================================================
// CELEBRATION ANIMATION
// ============================================================================

function celebrate(score) {
    const factor = calculate_score_factor(score);
    const particles = create_emoji_particles();

    setTimeout(() => converge_particles(particles, factor), 100);
    setTimeout(() => explode_particles(particles, factor), 700);
}

function calculate_score_factor(score) {
    // higher score (worse performance) results in lower factor
    const safeScore = Math.max(score, 1);
    const factor = 1 / Math.log10(safeScore + 10);
    return Math.min(Math.max(factor, 0.2), 1);
}

function create_emoji_particles() {
    const revealed_cards = document.querySelectorAll(".card.revealed");
    const particles = [];

    revealed_cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const particle = create_particle(card.textContent, rect);
        document.body.appendChild(particle);
        particles.push(particle);
    });

    return particles;
}

function create_particle(emoji, rect) {
    const particle = document.createElement("div");
    particle.className = "emoji-particle";
    particle.textContent = emoji;
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    return particle;
}

function converge_particles(particles, factor) {
    hide_revealed_cards();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const convergeScale = 1.3 + factor * 0.7;

    particles.forEach(particle => {
        const startX = parseFloat(particle.style.left);
        const startY = parseFloat(particle.style.top);
        const dx = centerX - startX;
        const dy = centerY - startY;

        particle.style.transform = `
            translate(-50%, -50%)
            translate(${dx}px, ${dy}px)
            scale(${convergeScale})
        `;
    });
}

function hide_revealed_cards() {
    const revealed_cards = document.querySelectorAll(".card.revealed");
    revealed_cards.forEach(card => {
        card.textContent = "";
    });
}

function explode_particles(particles, factor) {
    play_celebration_sound(factor);

    particles.forEach(particle => {
        apply_explosion_transform(particle, factor);
    });

    cleanup_after_celebration(particles);
}

function play_celebration_sound(factor) {
    celebrate_sound.currentTime = 0;
    celebrate_sound.volume = 0.25 + factor * 0.35;
    celebrate_sound.play().catch(() => {});
}

function apply_explosion_transform(particle, factor) {
    const angle = Math.random() * Math.PI * 2;
    const baseDistance = 180;
    const bonusDistance = 260 * factor;
    const distance = baseDistance + bonusDistance + Math.random() * 120;

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const spin = (Math.random() * 360 + 360) * factor;
    const explodeDuration = 600 + factor * 500;

    particle.style.transition = `transform ${explodeDuration}ms cubic-bezier(.17,.67,.45,1.4), opacity 600ms`;
    particle.style.transform += `
        translate(${x}px, ${y}px)
        rotate(${spin}deg)
        scale(0.6)
    `;
    particle.style.opacity = 0;
}

function cleanup_after_celebration(particles) {
    setTimeout(() => {
        particles.forEach(particle => particle.remove());
        mark_board_finished();
        // enable reset button animation
        reset_button.classList.add("probing");
    }, 1000);
}

function mark_board_finished() {
    document.querySelectorAll(".card").forEach(card => {
        card.classList.remove("hidden", "flipped", "revealed");
        card.classList.add("finished");
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

reset_button.addEventListener("click", async () => {
    const response = await fetch("/new-board");
    const new_cards = await response.json();

    clearInterval(timer_id);
    initialise_game(new_cards);
});

document.addEventListener("DOMContentLoaded", () => {
    initialise_game(INITIAL_CARDS);
});