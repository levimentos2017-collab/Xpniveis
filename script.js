// === Cole aqui as credenciais do Supabase (Project Settings > API) ===
const SUPABASE_URL = https://vnmeeboldibscrtcgnte.supabase.co;
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZubWVlYm9sZGlic2NydGNnbnRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NzI1MzAsImV4cCI6MjA3NDI0ODUzMH0.JV_jDpOFqAyB_ydaq3BUyl9l6WQS0F4ZXwldUHP3iZg";
// ====================================================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// níveis
function getLevel(xp) {
  if (xp >= 450) return 3;
  if (xp >= 250) return 2;
  if (xp >= 100) return 1;
  return 0;
}

// render
function renderXP(playerId, xp) {
  const card = document.getElementById(playerId);
  const bar = card.querySelector(".xp-bar");
  const xpSpan = card.querySelector(".xp-value");
  const levelSpan = card.querySelector(".level-value");

  const percent = Math.round((xp / 450) * 100);
  bar.style.height = percent + "%";
  xpSpan.textContent = xp;
  levelSpan.textContent = getLevel(xp);
}

// aplicar XP
async function addXP(playerId) {
  const card = document.getElementById(playerId);
  const input = card.querySelector(".xp-input");
  let change = parseInt(input.value, 10);
  if (isNaN(change)) {
    input.value = "";
    return;
  }

  // pega xp atual
  const { data, error } = await supabase
    .from("personagens")
    .select("xp")
    .eq("id", playerId)
    .single();

  if (error) {
    console.error("Erro ao buscar XP:", error);
    return;
  }

  let current = data?.xp || 0;
  let novo = current + change;
  if (novo < 0) novo = 0;
  if (novo > 450) novo = 450;

  // atualiza no banco
  await supabase
    .from("personagens")
    .update({ xp: novo })
    .eq("id", playerId);

  input.value = "";
}

// escutar em tempo real
["daisuke", "jeronimo", "haruka", "fellippo", "serafim"].forEach(id => {
  // listener tempo real
  supabase
    .channel("realtime:" + id)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "personagens", filter: `id=eq.${id}` },
      payload => {
        renderXP(id, payload.new.xp);
      }
    )
    .subscribe();

  // carregar valor inicial
  supabase
    .from("personagens")
    .select("xp")
    .eq("id", id)
    .single()
    .then(({ data }) => {
      renderXP(id, data?.xp || 0);
    });
});
