"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Search,
  Flame,
  Shapes,
  Trophy,
  Heart,
  History,
  Plus,
  Settings,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Database,
  Zap,
  Menu,
  X,
  Download,
  Upload,
  LoaderCircle,
  RefreshCw,
  ArrowDownWideNarrow,
  Grid2X2,
  List,
  Check,
  Info,
  Target,
  BookOpen,
  Activity,
  Archive,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button } from "./ui/button";
import { OfferArt } from "./offer-art";
import { OfferForm } from "./offer-form";
import { OfferDetail } from "./offer-detail";
import {
  brl,
  day,
  displayDate,
  isScaled,
  status,
  NICHES,
  type Offer,
  type History as HistoryType,
} from "@/lib/domain";
const NAV = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Explorar ofertas", icon: Search },
  { name: "Ofertas em alta", icon: Flame },
  { name: "Nichos", icon: Shapes },
  { name: "Ranking", icon: Trophy },
  { name: "Favoritos", icon: Heart },
  { name: "Histórico", icon: History },
];
const COLORS = [
  "#c3f75b",
  "#639c5b",
  "#416e5d",
  "#314e45",
  "#7c8f5d",
  "#9bbd76",
];
type Filters = {
  niche: string;
  subniche: string;
  min: string;
  max: string;
  rating: string;
  status: string;
  date: string;
  favorites: boolean;
  archived: boolean;
};
const EMPTY_FILTERS: Filters = {
  niche: "",
  subniche: "",
  min: "",
  max: "",
  rating: "",
  status: "",
  date: "",
  favorites: false,
  archived: false,
};
export function MinerApp({ initialId }: { initialId?: string }) {
  const [offers, setOffers] = useState<Offer[]>([]),
    [history, setHistory] = useState<HistoryType[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [page, setPage] = useState("Dashboard"),
    [selected, setSelected] = useState<string | null>(initialId || null),
    [search, setSearch] = useState(""),
    [filters, setFilters] = useState<Filters>(EMPTY_FILTERS),
    [sort, setSort] = useState("recent"),
    [showFilters, setShowFilters] = useState(false),
    [layout, setLayout] = useState("grid"),
    [mobile, setMobile] = useState(false),
    [editor, setEditor] = useState<Offer | null | undefined>(undefined),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(
      null,
    ),
    [now, setNow] = useState<Date | null>(null);
  const importRef = useRef<HTMLInputElement>(null),
    searchRef = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    saving = useRef(false);
  function notify(message: string, error = false) {
    setToast({ message, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  }
  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const r = await fetch("/api/store", { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setOffers(d.offers);
      setHistory(d.history);
    } catch (e) {
      setLoadError((e as Error).message || "Falha ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    setNow(new Date());
    const onPop = () => {
      const m = location.pathname.match(/^\/ofertas\/([^/]+)/);
      setSelected(m ? decodeURIComponent(m[1]) : null);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", key);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  function navigate(name: string) {
    setPage(name);
    setSelected(null);
    setMobile(false);
    setSearch("");
    setFilters(EMPTY_FILTERS);
    window.history.pushState(null, "", "/");
  }
  function open(o: Offer) {
    setSelected(o.id);
    setMobile(false);
    window.history.pushState(null, "", `/ofertas/${encodeURIComponent(o.id)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function mutate(body: unknown) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    try {
      const r = await fetch("/api/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setOffers(d.offers);
      setHistory(d.history);
      notify("Alterações salvas no banco de dados.");
      return true;
    } catch (e) {
      notify((e as Error).message || "Não foi possível salvar.", true);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function remove(o: Offer) {
    if (
      window.confirm(
        `Excluir “${o.name}”? Esta ação remove a oferta e seus anexos. O histórico será preservado.`,
      )
    ) {
      if (await mutate({ action: "delete", id: o.id })) {
        setSelected(null);
        window.history.pushState(null, "", "/");
      }
    }
  }
  function download(data: unknown, name: string) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 30_000_000) throw Error("Limite de 30 MB por arquivo.");
      const data = JSON.parse(await file.text());
      await mutate({
        action: "import",
        offers: Array.isArray(data) ? data : data.offers,
      });
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }
  const active = offers.filter((o) => !o.archived),
    today = now ? day(now) : "",
    addedToday = active.filter((o) => day(new Date(o.createdAt)) === today),
    scaled = active.filter(isScaled),
    ranked = active
      .filter((o) => o.rating !== null)
      .sort((a, b) => b.rating! - a.rating!),
    distribution = Object.entries(
      active.reduce(
        (acc, o) => {
          acc[o.niche] = (acc[o.niche] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  const filtered = useMemo(
    () =>
      offers
        .filter((o) => {
          if (o.archived !== filters.archived) return false;
          if ((page === "Favoritos" || filters.favorites) && !o.favorite)
            return false;
          if (page === "Ofertas em alta" && !isScaled(o)) return false;
          if (
            search &&
            !`${o.name} ${o.niche} ${o.subniche} ${o.deliverables} ${o.audience}`
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR"))
          )
            return false;
          if (filters.niche && o.niche !== filters.niche) return false;
          if (filters.subniche && o.subniche !== filters.subniche) return false;
          if (filters.min && (o.maxPrice ?? o.price) < Number(filters.min))
            return false;
          if (filters.max && o.price > Number(filters.max)) return false;
          if (
            filters.rating &&
            (o.rating === null || o.rating < Number(filters.rating))
          )
            return false;
          if (filters.status && status(o) !== filters.status) return false;
          if (filters.date && day(new Date(o.createdAt)) !== filters.date)
            return false;
          return true;
        })
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : sort === "rating"
                ? (b.rating ?? -1) - (a.rating ?? -1)
                : sort === "alpha"
                  ? a.name.localeCompare(b.name, "pt-BR")
                  : b.createdAt.localeCompare(a.createdAt),
        ),
    [offers, page, search, filters, sort],
  );
  const current = selected ? offers.find((o) => o.id === selected) : undefined,
    filterCount = Object.values(filters).filter(Boolean).length;
  const filter = (k: keyof Filters, v: unknown) =>
    setFilters((old) => ({ ...old, [k]: v }));
  const canCatalog = [
    "Dashboard",
    "Explorar ofertas",
    "Favoritos",
    "Ofertas em alta",
  ].includes(page);
  function card(o: Offer) {
    return (
      <article className="offer-card" key={o.id}>
        <div className="card-art-wrap" onClick={() => open(o)}>
          {o.images.find((i) => i.kind === "Produto") ? (
            <div className="real-product">
              <img
                src={o.images.find((i) => i.kind === "Produto")!.data}
                alt={o.name}
              />
              <span className="illustration-label">Imagem cadastrada</span>
            </div>
          ) : (
            <OfferArt offer={o} />
          )}
          <button
            className={`favorite-button ${o.favorite ? "is-favorite" : ""}`}
            aria-label={
              o.favorite
                ? `Remover ${o.name} dos favoritos`
                : `Favoritar ${o.name}`
            }
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              mutate({
                action: "patch",
                id: o.id,
                patch: { favorite: !o.favorite },
              });
            }}
          >
            <Heart size={17} fill={o.favorite ? "currentColor" : "none"} />
          </button>
          <span className="format-label">PDF / DIGITAL</span>
        </div>
        <div className="offer-card-body">
          <div className="card-category">{o.niche}</div>
          <h3>
            <a
              href={`/ofertas/${o.id}`}
              onClick={(e) => {
                e.preventDefault();
                open(o);
              }}
            >
              {o.name}
            </a>
          </h3>
          <p className="card-description">{o.deliverables}</p>
          <div className="card-price">
            <strong>
              {brl(o.price)}
              {o.maxPrice && <small> – {brl(o.maxPrice)}</small>}
            </strong>
            <span className={`rating ${o.rating === null ? "no-rating" : ""}`}>
              {o.rating === null
                ? "Sem nota"
                : `★ ${o.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}`}
              <small>{o.rating !== null ? "/5" : ""}</small>
            </span>
          </div>
          <div className={`status ${isScaled(o) ? "verified" : ""}`}>
            <span />
            {status(o)}
          </div>
          <div className="card-actions">
            <Button variant="outline" size="sm" onClick={() => open(o)}>
              Ver detalhes
              <ArrowUpRight size={15} />
            </Button>
            <a
              className="sales-link"
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Página de vendas
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </article>
    );
  }
  function trends() {
    const niches = [...new Set(offers.map((o) => o.niche))];
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now || Date.now());
      d.setDate(d.getDate() - (13 - i));
      const date = day(d);
      const row: Record<string, string | number> = {
        date: date.slice(8) + "/" + date.slice(5, 7),
      };
      niches.forEach((n, k) => {
        row["n" + k] = offers.filter(
          (o) => o.niche === n && day(new Date(o.createdAt)) === date,
        ).length;
      });
      return row;
    });
    return (
      <section className="panel trends-panel">
        <div className="section-title">
          <div>
            <h2>Cadastros por dia e nicho</h2>
            <p className="muted small">
              Últimos 14 dias · registros da base atual, incluindo arquivadas
            </p>
          </div>
          <span className="chip">Sem projeções</span>
        </div>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <BarChart
              data={days}
              margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid stroke="#2c3624" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#91a07e", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#91a07e", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a2414",
                  border: "1px solid #465734",
                  borderRadius: 8,
                  color: "#dce8cb",
                }}
                cursor={{ fill: "#b9db8c09" }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
              {niches.map((n, i) => (
                <Bar
                  isAnimationActive={false}
                  key={n}
                  dataKey={"n" + i}
                  name={n}
                  stackId="niches"
                  fill={COLORS[i % COLORS.length]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    );
  }
  function nicheChart() {
    return (
      <section className="panel niche-panel">
        <div className="section-title">
          <div>
            <h2>Mapa de nichos</h2>
            <p className="muted small">Distribuição da sua base de ofertas</p>
          </div>
          <button
            className="icon-text"
            aria-label="Ver nichos"
            onClick={() => navigate("Nichos")}
          >
            <ArrowUpRight size={19} />
          </button>
        </div>
        <div className="niche-content">
          <div className="donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={distribution}
                  dataKey="value"
                  innerRadius="72%"
                  outerRadius="95%"
                  paddingAngle={4}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {distribution.map((d, i) => (
                    <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1c211c",
                    border: "1px solid #394135",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#c3f75b" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{active.length}</strong>
              <span>ofertas</span>
            </div>
          </div>
          <div className="niche-legend">
            {distribution.map((d, i) => (
              <button
                key={d.name}
                onClick={() => {
                  navigate("Explorar ofertas");
                  setFilters({ ...EMPTY_FILTERS, niche: d.name });
                }}
              >
                <i style={{ background: COLORS[i % COLORS.length] }} />
                <span>{d.name}</span>
                <strong>{d.value}</strong>
                <small>
                  {active.length
                    ? ((d.value / active.length) * 100).toLocaleString(
                        "pt-BR",
                        { maximumFractionDigits: 1 },
                      )
                    : 0}
                  %
                </small>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }
  function ranking(compact = false) {
    return (
      <section className={`panel ranking-panel ${compact ? "compact" : ""}`}>
        <div className="section-title">
          <div>
            <h2>Ranking de oportunidades</h2>
            <p className="muted small">
              Potencial de modelagem · avaliação preliminar
            </p>
          </div>
          {compact && (
            <button className="text-link" onClick={() => navigate("Ranking")}>
              Ver ranking
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
        {ranked.length ? (
          ranked.slice(0, compact ? 3 : ranked.length).map((o, i) => (
            <button className="ranking-row" key={o.id} onClick={() => open(o)}>
              <span className={`rank-number rank-${i}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="ranking-thumb">
                <OfferArt offer={o} small />
              </div>
              <div className="ranking-name">
                <strong>{o.name}</strong>
                <small>{o.niche}</small>
              </div>
              <span className="rank-rating">
                ★{" "}
                {o.rating!.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                })}
                <small>/5</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))
        ) : (
          <div className="empty-inline">Nenhuma avaliação cadastrada.</div>
        )}
        <div className="panel-note">
          <Info size={14} />
          Notas qualitativas. Não representam vendas ou faturamento.
        </div>
      </section>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      {mobile && (
        <div className="sidebar-scrim" onClick={() => setMobile(false)} />
      )}
      <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("Dashboard");
          }}
        >
          <span className="brand-symbol">
            <Zap size={24} fill="currentColor" />
          </span>
          <span>
            SPREZZ
            <span className="brand-sub">
              MINER
              <span className="brand-dot" />
            </span>
          </span>
        </a>
        <button className="workspace" onClick={() => navigate("Configurações")}>
          <span className="workspace-avatar">S</span>
          <span>
            Meu workspace<small>Inteligência de mercado</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-caption">PLATAFORMA</div>
        <nav>
          {NAV.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={
                page === name && !selected ? "nav-item active" : "nav-item"
              }
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Explorar ofertas" && <small>{active.length}</small>}
              {name === "Favoritos" && active.some((o) => o.favorite) && (
                <small>{active.filter((o) => o.favorite).length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-divider" />
        <button
          className="nav-item"
          onClick={() => {
            setMobile(false);
            setEditor(null);
          }}
        >
          <Plus size={18} />
          Adicionar oferta
        </button>
        <button
          className={page === "Configurações" ? "nav-item active" : "nav-item"}
          onClick={() => navigate("Configurações")}
        >
          <Settings size={18} />
          Configurações
        </button>
        <div className="sidebar-bottom">
          <div className="mining-card">
            <span className="mining-icon">
              <Target size={18} />
            </span>
            <strong>Mineração com critério.</strong>
            <p>
              Encontre potencial.
              <br />
              Valide com evidências.
            </p>
            <button onClick={() => navigate("Histórico")}>
              Acompanhar mineração
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="database-state">
            <span />
            <span>
              Banco local persistente<small>Cadastro manual habilitado</small>
            </span>
            <Database size={15} />
          </div>
          <button className="profile" onClick={() => navigate("Configurações")}>
            <span className="profile-avatar">SM</span>
            <span>
              Meu workspace<small>Mercado brasileiro</small>
            </span>
            <Settings size={15} />
          </button>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{selected ? "Detalhes da oferta" : page}</strong>
          </div>
          <div className="topbar-right">
            <span className="market-badge">
              <span />
              Brasil <span className="muted">/</span> BRL
            </span>
            <div className="topbar-divider" />
            <span className="topbar-avatar">SM</span>
          </div>
        </header>
        <main id="main">
          {loading ? (
            <div className="loading-state">
              <LoaderCircle className="spin" />
              <h2>Preparando sua inteligência de mercado</h2>
              <p>Carregando ofertas do banco de dados…</p>
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <Database size={35} />
              <h2>Não foi possível carregar a base</h2>
              <p>{loadError}</p>
              <Button onClick={load}>
                <RefreshCw size={16} />
                Tentar novamente
              </Button>
            </div>
          ) : selected ? (
            current ? (
              <OfferDetail
                o={current}
                busy={busy}
                back={() => {
                  setSelected(null);
                  window.history.pushState(null, "", "/");
                }}
                edit={() => setEditor(current)}
                patch={(p) =>
                  mutate({ action: "patch", id: current.id, patch: p })
                }
                remove={() => remove(current)}
              />
            ) : (
              <div className="empty-state">
                <Search size={32} />
                <h2>Oferta não encontrada</h2>
                <Button onClick={() => navigate("Explorar ofertas")}>
                  Voltar às ofertas
                </Button>
              </div>
            )
          ) : (
            <>
              <div className="page-title">
                <div>
                  <div className="eyebrow">
                    INTELIGÊNCIA PARA DECIDIR MELHOR
                  </div>
                  <h1>{page === "Dashboard" ? "Visão geral" : page}</h1>
                  <p>
                    {page === "Dashboard"
                      ? "Seu radar de oportunidades no mercado low ticket."
                      : page === "Explorar ofertas"
                        ? "Encontre, organize e analise sua próxima oportunidade."
                        : page === "Favoritos"
                          ? "As oportunidades que você quer acompanhar de perto."
                          : page === "Ofertas em alta"
                            ? "Ofertas com pelo menos dois sinais de escala documentados."
                            : page === "Ranking"
                              ? "Potencial de modelagem, com transparência nos critérios."
                              : page === "Nichos"
                                ? "Uma visão clara dos mercados presentes na sua base."
                                : page === "Histórico"
                                  ? "Sua rotina de mineração, registrada a cada descoberta."
                                  : "Gerencie sua base e seu ambiente de trabalho."}
                  </p>
                </div>
                <div className="action-row">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={15} />
                    Importar
                  </Button>
                  <Button onClick={() => setEditor(null)}>
                    <Plus size={17} />
                    Adicionar oferta
                  </Button>
                </div>
              </div>
              {page === "Dashboard" && (
                <>
                  <section className="hero-banner">
                    <div className="hero-copy">
                      <span className="hero-kicker">
                        <span /> SEU PRÓXIMO PASSO COMEÇA AQUI
                      </span>
                      <h2>
                        Boas oportunidades.
                        <br />
                        <em>Decisões com evidências.</em>
                      </h2>
                      <p>
                        Explore ofertas low ticket, descubra padrões e
                        transforme
                        <br className="desktop-break" /> referências em novas
                        possibilidades para o seu negócio.
                      </p>
                      <button onClick={() => navigate("Explorar ofertas")}>
                        Explorar oportunidades
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="hero-visual" aria-hidden="true">
                      <div className="radar-orbit orbit-1" />
                      <div className="radar-orbit orbit-2" />
                      <div className="radar-orbit orbit-3" />
                      <div className="radar-line" />
                      <div className="radar-point p1" />
                      <div className="radar-point p2" />
                      <div className="radar-point p3" />
                      <div className="radar-core">
                        <Zap fill="currentColor" size={39} />
                      </div>
                      <div className="radar-tag">
                        <ShieldCheck size={14} />
                        Evidências primeiro
                      </div>
                    </div>
                    <span className="hero-index">SPREZZ INTELLIGENCE / 01</span>
                  </section>
                  <div className="metrics">
                    <div className="metric">
                      <span className="metric-label">
                        Ofertas cadastradas
                        <Database size={17} />
                      </span>
                      <div>
                        <strong>
                          {active.length.toString().padStart(2, "0")}
                        </strong>
                        <span className="metric-caption">
                          <span className="little-dot" />
                          Na sua base de inteligência
                        </span>
                      </div>
                      <p>Referências prontas para analisar</p>
                    </div>
                    <div className="metric">
                      <span className="metric-label">
                        Escala verificada
                        <ShieldCheck size={18} />
                      </span>
                      <div>
                        <strong>
                          {scaled.length.toString().padStart(2, "0")}
                        </strong>
                        <span className="neutral-tag">
                          {scaled.length
                            ? "Com evidências"
                            : "Aguardando evidências"}
                        </span>
                      </div>
                      <p>Ao menos 2 critérios documentados</p>
                    </div>
                    <div className="metric">
                      <span className="metric-label">
                        Adicionadas hoje
                        <Plus size={19} />
                      </span>
                      <div>
                        <strong>
                          {addedToday.length.toString().padStart(2, "0")}
                        </strong>
                        <span className="metric-caption">
                          {now?.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            timeZone: "America/Sao_Paulo",
                          })}
                        </span>
                      </div>
                      <p>Novas referências no seu radar</p>
                    </div>
                    <div className="metric">
                      <span className="metric-label">
                        Nicho predominante
                        <Shapes size={18} />
                      </span>
                      <div>
                        <strong className="niche-value">
                          {distribution[0]?.name || "Sem ofertas"}
                        </strong>
                      </div>
                      <p>
                        <span className="lime">
                          {distribution[0]?.value || 0} ofertas
                        </span>{" "}
                        ·{" "}
                        {active.length
                          ? (
                              ((distribution[0]?.value || 0) / active.length) *
                              100
                            ).toLocaleString("pt-BR", {
                              maximumFractionDigits: 1,
                            })
                          : 0}
                        % da base cadastrada
                      </p>
                    </div>
                  </div>
                </>
              )}
              {canCatalog && (
                <>
                  <div className="catalog-title">
                    <div>
                      <h2>
                        {page === "Dashboard"
                          ? "No seu radar"
                          : page === "Ofertas em alta"
                            ? "Sinais de escala verificados"
                            : page === "Favoritos"
                              ? "Suas ofertas favoritas"
                              : "Todas as ofertas"}
                        <span className="count-badge">{filtered.length}</span>
                      </h2>
                      {page === "Dashboard" && (
                        <p className="muted small">
                          Referências selecionadas para a sua próxima análise.
                        </p>
                      )}
                    </div>
                    {page === "Dashboard" && (
                      <button
                        className="text-link"
                        onClick={() => navigate("Explorar ofertas")}
                      >
                        Ver todas as ofertas
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                  <div className="toolbar">
                    <div className="search-input">
                      <Search size={17} />
                      <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar ofertas, nichos ou palavras-chave…"
                        aria-label="Buscar ofertas"
                      />
                      {search ? (
                        <button
                          aria-label="Limpar busca"
                          onClick={() => setSearch("")}
                        >
                          <X size={14} />
                        </button>
                      ) : (
                        <kbd>⌘ K</kbd>
                      )}
                    </div>
                    <select
                      aria-label="Filtrar por nicho"
                      className="niche-select"
                      value={filters.niche}
                      onChange={(e) => {
                        filter("niche", e.target.value);
                        filter("subniche", "");
                      }}
                    >
                      <option value="">Todos os nichos</option>
                      {[
                        ...new Set([...NICHES, ...offers.map((o) => o.niche)]),
                      ].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      className={showFilters ? "filter-active" : ""}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <SlidersHorizontal size={15} />
                      Filtros
                      {filterCount > 0 && (
                        <span className="filter-count">{filterCount}</span>
                      )}
                    </Button>
                    <div className="sort-control">
                      <ArrowDownWideNarrow size={15} />
                      <select
                        aria-label="Ordenar ofertas"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="recent">Mais recentes</option>
                        <option value="low">Menor preço</option>
                        <option value="high">Maior preço</option>
                        <option value="rating">Maior nota</option>
                        <option value="alpha">Ordem alfabética</option>
                      </select>
                    </div>
                    <div className="layout-toggle">
                      <button
                        aria-label="Visualização em cards"
                        aria-pressed={layout === "grid"}
                        className={layout === "grid" ? "active" : ""}
                        onClick={() => setLayout("grid")}
                      >
                        <Grid2X2 size={16} />
                      </button>
                      <button
                        aria-label="Visualização em lista"
                        aria-pressed={layout === "list"}
                        className={layout === "list" ? "active" : ""}
                        onClick={() => setLayout("list")}
                      >
                        <List size={17} />
                      </button>
                    </div>
                  </div>
                  {showFilters && (
                    <div className="filter-panel">
                      <label className="field">
                        <span>Subnicho</span>
                        <select
                          value={filters.subniche}
                          onChange={(e) => filter("subniche", e.target.value)}
                        >
                          <option value="">Todos</option>
                          {[
                            ...new Set(
                              offers
                                .filter(
                                  (o) =>
                                    !filters.niche || o.niche === filters.niche,
                                )
                                .map((o) => o.subniche),
                            ),
                          ]
                            .filter(Boolean)
                            .map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Preço mínimo (R$)</span>
                        <input
                          type="number"
                          min="9.9"
                          max="97"
                          step="0.01"
                          value={filters.min}
                          onChange={(e) => filter("min", e.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Preço máximo (R$)</span>
                        <input
                          type="number"
                          min="9.9"
                          max="97"
                          step="0.01"
                          value={filters.max}
                          onChange={(e) => filter("max", e.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>Nota mínima</span>
                        <select
                          value={filters.rating}
                          onChange={(e) => filter("rating", e.target.value)}
                        >
                          <option value="">Todas</option>
                          {[1, 2, 3, 4, 4.5, 5].map((n) => (
                            <option value={n} key={n}>
                              {n.toLocaleString("pt-BR")} ou mais
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Status</span>
                        <select
                          value={filters.status}
                          onChange={(e) => filter("status", e.target.value)}
                        >
                          <option value="">Todos</option>
                          {[
                            "Não verificada",
                            "Em verificação",
                            "Sinais de escala verificados",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Data de cadastro</span>
                        <input
                          type="date"
                          max={today}
                          value={filters.date}
                          onChange={(e) => filter("date", e.target.value)}
                        />
                      </label>
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={filters.favorites}
                          onChange={(e) =>
                            filter("favorites", e.target.checked)
                          }
                        />
                        Somente favoritas
                      </label>
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={filters.archived}
                          onChange={(e) => filter("archived", e.target.checked)}
                        />
                        Exibir arquivadas
                      </label>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setFilters(EMPTY_FILTERS);
                          setSearch("");
                        }}
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                  {page === "Ofertas em alta" && (
                    <div className="alert">
                      <ShieldCheck size={18} />
                      <span>
                        Escala é um sinal documentado, não uma confirmação de
                        vendas. Um anúncio ativo, sozinho, não é suficiente.
                      </span>
                    </div>
                  )}
                  {filtered.length ? (
                    <div
                      className={`offers-grid ${layout === "list" ? "offers-list" : ""}`}
                    >
                      {(page === "Dashboard"
                        ? filtered.slice(0, 6)
                        : filtered
                      ).map(card)}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Search size={34} />
                      <h2>
                        {page === "Ofertas em alta"
                          ? "Nenhuma oferta com escala verificada"
                          : page === "Favoritos"
                            ? "Sua seleção começa aqui"
                            : "Nenhuma oferta encontrada"}
                      </h2>
                      <p>
                        {page === "Ofertas em alta"
                          ? "As oito referências iniciais aguardam evidências. Registre verificações nas páginas individuais."
                          : page === "Favoritos"
                            ? "Toque no coração de uma oferta para adicioná-la aos favoritos."
                            : "Ajuste a busca ou limpe os filtros para explorar sua base."}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          page === "Favoritos" || page === "Ofertas em alta"
                            ? navigate("Explorar ofertas")
                            : (setFilters(EMPTY_FILTERS), setSearch(""))
                        }
                      >
                        Explorar ofertas
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  )}
                  {page === "Dashboard" && (
                    <>
                      <div className="catalog-bottom">
                        <span>
                          Exibindo {Math.min(6, filtered.length)} de{" "}
                          {filtered.length} ofertas · Preços anunciados, não
                          verificados no checkout
                        </span>
                        <button
                          className="text-link"
                          onClick={() => navigate("Explorar ofertas")}
                        >
                          Continuar explorando
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="insight-grid">
                        {ranking(true)}
                        {nicheChart()}
                      </div>
                      <div className="integrity-note">
                        <ShieldCheck size={17} />
                        <span>
                          <strong>Inteligência com transparência.</strong>{" "}
                          Nenhum dado de vendas, faturamento ou escala é
                          estimado. Cada informação tem sua origem e seu status.
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
              {page === "Ranking" && (
                <>
                  {ranking()}
                  <div className="alert">
                    <Info size={18} />
                    <span>
                      Somente ofertas com nota atribuída participam deste
                      ranking. As notas são avaliações qualitativas de potencial
                      de modelagem.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate("Ofertas em alta")}
                  >
                    <ShieldCheck size={17} />
                    Ver ofertas com escala verificada
                  </Button>
                </>
              )}
              {page === "Nichos" && (
                <>
                  {nicheChart()}
                  <div className="niches-grid">
                    {distribution.map((n, i) => (
                      <button
                        className="panel niche-card"
                        key={n.name}
                        onClick={() => {
                          navigate("Explorar ofertas");
                          setFilters({ ...EMPTY_FILTERS, niche: n.name });
                        }}
                      >
                        <span
                          className="niche-icon"
                          style={{ color: COLORS[i % COLORS.length] }}
                        >
                          <BookOpen size={23} />
                        </span>
                        <h2>{n.name}</h2>
                        <p>
                          {n.value}{" "}
                          {n.value === 1
                            ? "oferta cadastrada"
                            : "ofertas cadastradas"}
                        </p>
                        <span className="text-link">
                          Explorar nicho
                          <ArrowUpRight size={15} />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {page === "Histórico" && (
                <>
                  <div className="metrics history-metrics">
                    <div className="metric">
                      <span className="metric-label">
                        Descobertas de hoje
                        <Target size={17} />
                      </span>
                      <strong>
                        {addedToday.length}
                        <small>/ 10</small>
                      </strong>
                      <p>Meta de cadastro manual · sem coleta automática</p>
                    </div>
                    <div className="metric">
                      <span className="metric-label">
                        Aprovadas por evidências
                        <ShieldCheck size={17} />
                      </span>
                      <strong>{scaled.length}</strong>
                      <p>Com sinais de escala verificados</p>
                    </div>
                    <div className="metric">
                      <span className="metric-label">
                        Aguardando verificação
                        <Activity size={17} />
                      </span>
                      <strong>{active.length - scaled.length}</strong>
                      <p>Registre as fontes antes de aprovar</p>
                    </div>
                  </div>
                  <div className="alert">
                    <Info size={18} />
                    <span>
                      Mineração automática não conectada. Use cadastro manual ou
                      importação JSON. Novas fontes só serão integradas com
                      autorização e disponibilidade técnica.
                    </span>
                  </div>
                  <div className="insight-grid">
                    <section className="panel">
                      <div className="section-title">
                        <h2>Ranking de hoje</h2>
                        <span className="chip">Qualitativo</span>
                      </div>
                      {addedToday
                        .filter((o) => o.rating !== null)
                        .sort((a, b) => b.rating! - a.rating!)
                        .map((o) => (
                          <button
                            className="daily-row"
                            key={o.id}
                            onClick={() => open(o)}
                          >
                            {o.name}
                            <span className="lime">
                              ★ {o.rating!.toLocaleString("pt-BR")}
                            </span>
                          </button>
                        ))}
                      {!addedToday.some((o) => o.rating !== null) && (
                        <p className="muted">
                          Nenhuma oferta com nota adicionada hoje.
                        </p>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Distribuição das descobertas de hoje</h2>
                      <p className="muted small">
                        Contagem diária, sem inferir tendência histórica.
                      </p>
                      {Object.entries(
                        addedToday.reduce(
                          (a, o) => ({
                            ...a,
                            [o.niche]: (a[o.niche] || 0) + 1,
                          }),
                          {} as Record<string, number>,
                        ),
                      ).map(([n, count]) => (
                        <div className="daily-row" key={n}>
                          {n}
                          <span className="lime">{count}</span>
                        </div>
                      ))}
                      {!addedToday.length && (
                        <p className="muted">
                          Nenhuma descoberta cadastrada hoje.
                        </p>
                      )}
                    </section>
                  </div>
                  {trends()}
                  <section className="panel history-panel">
                    <div className="section-title">
                      <h2>Histórico de atividades</h2>
                      <span className="chip">Últimos 1.000 registros</span>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Oferta</th>
                            <th>Atividade</th>
                            <th>Data e hora · Brasília</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((h) => (
                            <tr key={h.id}>
                              <td>
                                {offers.some((o) => o.id === h.offerId) ? (
                                  <button
                                    className="text-link"
                                    onClick={() =>
                                      open(
                                        offers.find((o) => o.id === h.offerId)!,
                                      )
                                    }
                                  >
                                    {h.name}
                                  </button>
                                ) : (
                                  h.name
                                )}
                              </td>
                              <td>{h.action}</td>
                              <td>
                                {new Date(h.date).toLocaleString("pt-BR", {
                                  timeZone: "America/Sao_Paulo",
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
              {page === "Configurações" && (
                <div className="settings-grid">
                  <section className="panel">
                    <div className="section-title">
                      <h2>Meu workspace</h2>
                      <Settings size={20} />
                    </div>
                    <div className="settings-row">
                      <span>Mercado</span>
                      <strong>Brasil · Português brasileiro</strong>
                    </div>
                    <div className="settings-row">
                      <span>Moeda</span>
                      <strong>Real brasileiro (BRL)</strong>
                    </div>
                    <div className="settings-row">
                      <span>Faixa de preços</span>
                      <strong>R$ 9,90 a R$ 97,00</strong>
                    </div>
                    <div className="settings-row">
                      <span>Fuso dos relatórios</span>
                      <strong>America/Sao_Paulo</strong>
                    </div>
                    <div className="settings-row">
                      <span>Armazenamento</span>
                      <strong>SQLite no servidor</strong>
                    </div>
                    <p className="muted small">
                      Dados persistidos em disco. Para hospedagem, configure um
                      volume persistente e a senha de acesso. Não depende do
                      armazenamento do navegador.
                    </p>
                  </section>
                  <section className="panel">
                    <h2>Dados e portabilidade</h2>
                    <p className="muted">
                      Exporte suas ofertas, imagens e evidências ou importe
                      novos cadastros em JSON. Importações são atômicas:
                      qualquer erro cancela todo o lote.
                    </p>
                    <div className="action-row wrap">
                      <Button
                        variant="outline"
                        onClick={() =>
                          download(
                            {
                              version: 1,
                              exportedAt: new Date().toISOString(),
                              offers,
                            },
                            `sprezz-miner-${today}.json`,
                          )
                        }
                      >
                        <Download size={16} />
                        Exportar base completa
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => importRef.current?.click()}
                      >
                        <Upload size={16} />
                        Importar JSON
                      </Button>
                    </div>
                    <p className="muted small">
                      A exportação contém os identificadores existentes. Para
                      restaurar, use uma base vazia; para adicionar uma nova
                      referência, remova o ID e altere a URL. URLs normalizadas
                      e IDs repetidos são rejeitados.
                    </p>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        download(
                          [
                            {
                              name: "Nome da nova oferta",
                              niche: "Educação e alfabetização",
                              subniche: "",
                              audience: "",
                              price: 19.9,
                              url: "https://exemplo.com/nova-oferta",
                              deliverables: "",
                              modeling: "",
                              evidence: [],
                              images: [],
                            },
                          ],
                          "modelo-importacao.json",
                        )
                      }
                    >
                      Baixar modelo de importação
                      <Download size={15} />
                    </Button>
                  </section>
                  <section className="panel">
                    <h2>Integrações de pesquisa</h2>
                    <p className="muted">
                      Biblioteca de Anúncios da Meta · pesquisa manual
                    </p>
                    <Button variant="outline" asChild>
                      <a
                        href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir Biblioteca de Anúncios
                        <ExternalLink size={15} />
                      </a>
                    </Button>
                    <p className="muted small">
                      País: Brasil · Categoria: todos os anúncios · Status:
                      ativos
                    </p>
                    <div className="research-terms">
                      {[
                        "PDF",
                        "Kit",
                        "Apostila",
                        "Atividades prontas",
                        "Material completo",
                        "Acesso imediato",
                        "R$ 9,90",
                        "R$ 19,90",
                        "R$ 27",
                        "R$ 37",
                      ].map((t) => (
                        <button
                          className="chip"
                          key={t}
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(t)
                              .then(() => notify(`Termo copiado: ${t}`))
                              .catch(() =>
                                notify(
                                  "Não foi possível copiar o termo.",
                                  true,
                                ),
                              );
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="alert">
                      Nenhuma fonte de mineração automática conectada. Não há
                      anúncios, resultados ou pesquisas simulados.
                    </div>
                  </section>
                  <section className="panel">
                    <h2>Ofertas arquivadas</h2>
                    <p className="muted">
                      {offers.filter((o) => o.archived).length} ofertas fora da
                      base ativa.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate("Explorar ofertas");
                        setFilters({ ...EMPTY_FILTERS, archived: true });
                        setShowFilters(true);
                      }}
                    >
                      <Archive size={16} />
                      Gerenciar arquivadas
                    </Button>
                    <p className="muted small">
                      Arquivar preserva dados e evidências. Você pode restaurar
                      uma oferta na página de detalhes.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
          {!loading && !loadError && (
            <footer className="footer">
              <span>
                SPREZZ MINER{" "}
                <span className="muted">/ Inteligência de mercado</span>
              </span>
              <span>
                <span className="little-dot" />
                Dados com contexto. Decisões com clareza.
              </span>
            </footer>
          )}
        </main>
      </div>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => importFile(e.target.files?.[0])}
      />
      {editor !== undefined && (
        <OfferForm
          key={editor?.id || "new"}
          offer={editor}
          onClose={() => setEditor(undefined)}
          busy={busy}
          onSave={(o) =>
            mutate({
              action: editor ? "update" : "create",
              id: editor?.id,
              offer: o,
            })
          }
        />
      )}
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={`toast ${toast.error ? "toast-error" : ""}`}
        >
          {toast.error ? <Info size={19} /> : <Check size={19} />}
          <span>{toast.message}</span>
          <button
            aria-label="Fechar notificação"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {busy && (
        <div className="saving-indicator" role="status">
          <LoaderCircle className="spin" size={14} />
          Salvando…
        </div>
      )}
    </div>
  );
}
