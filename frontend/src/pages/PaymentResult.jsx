import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API } from "../lib/api";
import { useCart } from "../context/CartContext";

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { clearCart } = useCart();
  const [state, setState] = useState("checking");
  const tries = useRef(0);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) return setState("error");
    const poll = async () => {
      try {
        const { data } = await API.get(`/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setState("paid");
          if (!cleared.current) { cleared.current = true; clearCart(); }
          return;
        }
        if (data.payment_status === "expired") return setState("expired");
      } catch { /* retry */ }
      if (tries.current++ < 15) setTimeout(poll, 2000);
      else setState("pending");
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-32 text-center" data-testid="payment-success-page">
      {state === "checking" && <p className="font-mono text-zinc-400 animate-pulse" data-testid="payment-checking">CONFIRMING YOUR PAYMENT…</p>}
      {state === "paid" && (
        <>
          <p className="eyebrow mb-4">ORDER CONFIRMED</p>
          <h1 className="font-display font-black uppercase italic text-5xl sm:text-7xl" data-testid="payment-confirmed">You're in.</h1>
          <p className="text-zinc-400 mt-6 max-w-md mx-auto text-sm">Payment received. Your order is confirmed and being prepared. Details live in your account.</p>
          <div className="flex gap-4 justify-center mt-10">
            <Link to="/account" className="btn-primary" data-testid="view-orders-button">VIEW MY ORDERS</Link>
            <Link to="/shop" className="btn-outline">KEEP SHOPPING</Link>
          </div>
        </>
      )}
      {(state === "pending" || state === "expired" || state === "error") && (
        <>
          <h1 className="font-display font-black uppercase italic text-4xl sm:text-6xl" data-testid="payment-unresolved">
            {state === "expired" ? "Session expired" : "Still processing"}
          </h1>
          <p className="text-zinc-400 mt-6 text-sm">If you completed payment, your order will appear in your account shortly.</p>
          <Link to="/shop" className="btn-outline mt-10 inline-flex">BACK TO SHOP</Link>
        </>
      )}
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-32 text-center" data-testid="payment-cancel-page">
      <h1 className="font-display font-black uppercase italic text-4xl sm:text-6xl">Payment cancelled</h1>
      <p className="text-zinc-400 mt-6 text-sm">Nothing was charged. Your bag is still waiting.</p>
      <Link to="/checkout" className="btn-primary mt-10 inline-flex" data-testid="retry-checkout-button">BACK TO CHECKOUT</Link>
    </div>
  );
}
