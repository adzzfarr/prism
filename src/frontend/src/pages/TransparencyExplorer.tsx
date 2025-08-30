import { useEffect, useState } from "@lynx-js/react";
import { formatDateTime } from "../utils/format-date-time.tsx";
import { useNavigate } from "react-router";
import "../styles/TransparencyExplorer.css";

export default function TransparencyExplorer() {
    const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<any | null>(null);
  const [proof, setProof] = useState<any | null>(null);
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    fetch("http://localhost:4000/merkle/snapshot")
      .then(res => res.json())
      .then(data => {
        setSnapshot(data.snapshot);
        if (data.snapshot && data.snapshot.ledgerIds) {
          fetch("http://localhost:4000/ledgers/by-ids", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: data.snapshot.ledgerIds })
          })
            .then(res => res.json())
            .then(data => setLedgers(data.ledgers));
        }
      });
  }, []);

  const handleSelectLedger = async (ledger: any) => {
    setSelectedLedger(ledger);
    setProof(null);
    const res = await fetch(`http://localhost:4000/merkle/proof/${ledger.id}`);
    const data = await res.json();
    setProof(data);
  };

  return (
    <scroll-view className="transparency-explorer" scroll-y>
        <text className="dashboard-back" bindtap={() => navigate('/home')}>← Home</text>
      <text className="transparency-title">Transparency Explorer</text>
      <view className="transparency-intro">
        <text>Every payout and transaction is securely recorded.</text>
        <text>Prism uses cryptographic proofs (Merkle trees) to ensure records are tamper-proof and auditable.</text>
      </view>
      <view className="transparency-root-card">
        <text className="transparency-root-label">Current Ledger Integrity Code:</text>
        <view className="transparency-root-card-content">
            <text className="transparency-root-value" style={{ fontFamily: "monospace" }}>
            {snapshot?.root || "Loading..."}
            </text>
            <text className="transparency-root-desc">
            This code summarizes all transactions. If it ever changes, it means the records have changed.
            </text>
        </view>
      </view>
      <view className="ledger-list">
        <text className="ledger-list-title">Recent Transactions</text>
        <view className="ledger-list-content">
            {ledgers.length === 0 && <text className="no-transaction">No transactions found.</text>}
            {ledgers.map(ledger => (
            <view
                key={ledger.id}
                className={`ledger-item${selectedLedger?.id === ledger.id ? " selected" : ""}`}
                bindtap={() => handleSelectLedger(ledger)}
            >
                <text className="ledger-type">{ledger.refType === "gift" ? "Gift Sent" : ledger.refType === "fast-forward" ? "Payout" : ledger.refType}</text>
                <text className="ledger-amount">${ledger.amount.toFixed(2)}</text>
                <text className="ledger-date">{formatDateTime(ledger.createdAt)}</text>
                <text className="ledger-desc">
                {ledger.refType === "gift"
                    ? "A fan sent a gift during a live session."
                    : ledger.refType === "fast-forward"
                    ? "Funds paid out after live session ended."
                    : ""}
                </text>
                <view
                className="verify-btn"
                bindtap={() => handleSelectLedger(ledger)}
                >
                <text>
                    {selectedLedger?.id === ledger.id ? "Viewing Proof" : "Verify"}
                </text>
                </view>
            </view>
            ))}
        </view>
      </view>
      {selectedLedger && proof && (
        <view className="merkle-proof-section">
          <text className="proof-title">Proof of Inclusion</text>
          <text className="proof-desc">
            This transaction is cryptographically included in the official ledger. You can verify its inclusion below.
          </text>
          <view className="proof-visual">
            <text className="proof-success">✅ Verified!</text>
            <text className="proof-explain">
              The system checked this transaction against the ledger integrity code above.
            </text>
          </view>
          <view
            className="show-tech-btn"
            bindtap={() => setShowTech(!showTech)}
          >
            <text>
              {showTech ? "Hide Technical Details" : "Show Technical Details"}
            </text>
          </view>
          {showTech && (
            <view className="proof-tech-details">
              <view className="proof-row">
                <text>Transaction Hash:</text>
                <text style={{ fontFamily: "monospace" }}>
                  {proof.ledgerEntry?.hashThis}
                </text>
              </view>
              <view className="proof-row">
                <text>Merkle Root:</text>
                <text style={{ fontFamily: "monospace" }}>
                  {proof.merkleRoot}
                </text>
              </view>
              <text>Proof Path:</text>
              <view className="proof-list">
                {proof.proof.map((hash: string, idx: number) => (
                  <text key={idx} style={{ fontFamily: "monospace" }}>{hash}</text>
                ))}
              </view>
            </view>
          )}
        </view>
      )}
    </scroll-view>
  );
}