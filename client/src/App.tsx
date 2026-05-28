import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

// Pages
import Home from "./pages/Home";
import Casino from "./pages/Casino";
import Sports from "./pages/Sports";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Promotions from "./pages/Promotions";
import VIP from "./pages/VIP";
import Affiliate from "./pages/Affiliate";
import Settings from "./pages/Settings";
import ResponsibleGambling from "./pages/ResponsibleGambling";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProvablyFair from "./pages/ProvablyFair";
import Dashboard from "./pages/Dashboard";
import DailySpin from "./pages/DailySpin";
import WalletPage from "./pages/Wallet";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminGuard from "./pages/admin/AdminGuard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminBanned from "./pages/admin/BannedUsers";
import AdminTransactions from "./pages/admin/Transactions";
import AdminSuspicious from "./pages/admin/SuspiciousActivity";
import AdminGameStats from "./pages/admin/GameStats";
import AdminAccounts from "./pages/admin/AdminAccounts";

// Game pages
import Plinko from "./pages/Plinko";
import Dice from "./pages/Dice";
import GuessTheCup from "./pages/GuessTheCup";
import Blackjack from "./pages/Blackjack";
import Mines from "./pages/Mines";
import Crash from "./pages/Crash";
import HiLo from "./pages/HiLo";
import Keno from "./pages/Keno";
import Roulette from "./pages/Roulette";
import Baccarat from "./pages/Baccarat";
import VideoPoker from "./pages/VideoPoker";
import ThreeCardPoker from "./pages/ThreeCardPoker";
import CasinoWar from "./pages/CasinoWar";
import SicBo from "./pages/SicBo";
import Craps from "./pages/Craps";
import BigSix from "./pages/BigSix";
import DragonTiger from "./pages/DragonTiger";
import RedDog from "./pages/RedDog";
import ScratchCards from "./pages/ScratchCards";
import CoinFlip from "./pages/CoinFlip";
import Limbo from "./pages/Limbo";
import Tower from "./pages/Tower";
import ChuckALuck from "./pages/ChuckALuck";
import AndarBahar from "./pages/AndarBahar";
import WheelGame from "./pages/WheelGame";
import Pontoon from "./pages/Pontoon";
import CaribbeanStud from "./pages/CaribbeanStud";
import CasinoHoldem from "./pages/CasinoHoldem";
import LightningDice from "./pages/LightningDice";
import Bingo from "./pages/Bingo";
import RockPaperScissors from "./pages/RockPaperScissors";
import ClassicSlots from "./pages/ClassicSlots";
import Dice21 from "./pages/Dice21";
import Parity from "./pages/Parity";
import DiceDuel from "./pages/DiceDuel";
import ColorSpin from "./pages/ColorSpin";
import Lucky7 from "./pages/Lucky7";
import CardFlip from "./pages/CardFlip";
import PenaltyShoot from "./pages/PenaltyShoot";
import HotDice from "./pages/HotDice";
import NumberMatch from "./pages/NumberMatch";
import RapidRoulette from "./pages/RapidRoulette";
import JackpotBox from "./pages/JackpotBox";
import SlotJoker from "./pages/SlotJoker";

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      {/* Main */}
      <Route path="/" component={Home} />
      <Route path="/casino" component={Casino} />
      <Route path="/sports" component={Sports} />
      <Route path="/about" component={About} />

      {/* Auth */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Features */}
      <Route path="/promotions" component={Promotions} />
      <Route path="/vip" component={VIP} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/settings" component={Settings} />
      <Route path="/responsible-gambling" component={ResponsibleGambling} />
      <Route path="/blog" component={Blog} />
      <Route path="/careers" component={Careers} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/provably-fair" component={ProvablyFair} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/daily-spin" component={DailySpin} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/leaderboard" component={Leaderboard} />

      {/* Games */}
      <Route path="/plinko" component={Plinko} />
      <Route path="/dice" component={Dice} />
      <Route path="/guess-the-cup" component={GuessTheCup} />
      <Route path="/blackjack" component={Blackjack} />
      <Route path="/mines" component={Mines} />
      <Route path="/crash" component={Crash} />
      <Route path="/hilo" component={HiLo} />
      <Route path="/keno" component={Keno} />
      <Route path="/roulette" component={Roulette} />
      <Route path="/baccarat" component={Baccarat} />
      <Route path="/video-poker" component={VideoPoker} />
      <Route path="/three-card-poker" component={ThreeCardPoker} />
      <Route path="/casino-war" component={CasinoWar} />
      <Route path="/sicbo" component={SicBo} />
      <Route path="/craps" component={Craps} />
      <Route path="/bigsix" component={BigSix} />
      <Route path="/dragon-tiger" component={DragonTiger} />
      <Route path="/red-dog" component={RedDog} />
      <Route path="/scratch-cards" component={ScratchCards} />
      <Route path="/coinflip" component={CoinFlip} />
      <Route path="/limbo" component={Limbo} />
      <Route path="/tower" component={Tower} />
      <Route path="/chuck-a-luck" component={ChuckALuck} />
      <Route path="/andar-bahar" component={AndarBahar} />
      <Route path="/wheel" component={WheelGame} />
      <Route path="/pontoon" component={Pontoon} />
      <Route path="/caribbean-stud" component={CaribbeanStud} />
      <Route path="/casino-holdem" component={CasinoHoldem} />
      <Route path="/lightning-dice" component={LightningDice} />
      <Route path="/bingo" component={Bingo} />
      <Route path="/rps" component={RockPaperScissors} />
      <Route path="/classic-slots" component={ClassicSlots} />
      <Route path="/dice-21" component={Dice21} />
      <Route path="/parity" component={Parity} />
      <Route path="/dice-duel" component={DiceDuel} />
      <Route path="/color-spin" component={ColorSpin} />
      <Route path="/lucky-7" component={Lucky7} />
      <Route path="/card-flip" component={CardFlip} />
      <Route path="/penalty" component={PenaltyShoot} />
      <Route path="/hot-dice" component={HotDice} />
      <Route path="/number-match" component={NumberMatch} />
      <Route path="/rapid-roulette" component={RapidRoulette} />
      <Route path="/jackpot-box" component={JackpotBox} />
      <Route path="/slot-joker" component={SlotJoker} />

      {/* Admin */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={() => <AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/users" component={() => <AdminGuard><AdminUsers /></AdminGuard>} />
      <Route path="/admin/banned" component={() => <AdminGuard><AdminBanned /></AdminGuard>} />
      <Route path="/admin/transactions" component={() => <AdminGuard><AdminTransactions /></AdminGuard>} />
      <Route path="/admin/suspicious" component={() => <AdminGuard><AdminSuspicious /></AdminGuard>} />
      <Route path="/admin/game-stats" component={() => <AdminGuard><AdminGameStats /></AdminGuard>} />
      <Route path="/admin/accounts" component={() => <AdminGuard><AdminAccounts /></AdminGuard>} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {/*
       * Theme: "dark" by default (cyberpunk neon-green palette).
       * To make the theme user-switchable, add the `switchable` prop here
       * and call `useTheme().toggleTheme()` from any component.
       */}
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
