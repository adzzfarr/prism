import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from '@lynx-js/react';
import '../styles/ProjectedPayment.css';

type Settlement = {
  totalCoins?: number;
  creatorAmountCoins?: number;
  totalUSD?: number;
  creatorAmountUSD?: number;
  platformAmountUSD?: number;
  reserveAmountUSD?: number;
};

type QualityMetrics = {
  score?: number;
  retention?: number;
  engagement?: number;
};

function getCreatorShare(score: number | undefined) {
  if (score === undefined) return 0;
  if (score < 40) return 0.65;
  if (score < 70) return 0.7;
  if (score < 85) return 0.75;
  return 0.8;
}

function getCreatorShareText(score: number | undefined) {
  if (score === undefined) return '';

  const creatorShare = getCreatorShare(score);
  return `Your share: ${creatorShare * 100}% of gross earnings`;
}

export default function ProjectedPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutCredited, setPayoutCredited] = useState(false);

  useEffect(() => {
    async function fetchSettlement() {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/lives/${id}/settlement`);
      const data = await res.json();
      setSettlement(data.settlement);
      setQualityMetrics(data.qualityMetrics);
      setLoading(false);
    }
    fetchSettlement();
  }, [id]);

  // Format retention and engagement as percentages
  const retentionPercent = qualityMetrics?.retention !== undefined
    ? `${Math.round(qualityMetrics.retention * 100)}%`
    : '-';
  const engagementPercent = qualityMetrics?.engagement !== undefined
    ? `${Math.round(qualityMetrics.engagement * 100)}%`
    : '-';

  return (
    <view className="projected-payment-container">
      <text className="projected-payment-back" bindtap={() => navigate(-1)}>← Dashboard</text>
      <text className="projected-payment-title">Projected Payment Breakdown</text>
      {loading ? (
        <text>Loading...</text>
      ) : (
        <view className="projected-payment-content">
          <view className="projected-payment-metrics">
            <text className="projected-payment-metrics-title">Live Quality Metrics</text>
            <view className="projected-payment-metrics-values">  
              <view className="projected-payment-metrics-values">
                <view className="projected-payment-row">
                  <text className="projected-payment-label">Retention</text>
                  <text className="projected-payment-value">{retentionPercent}</text>
                </view>
                <view className="projected-payment-row">
                  <text className="projected-payment-label">Engagement</text>
                  <text className="projected-payment-value">{engagementPercent}</text>
                </view>
                <view className="projected-payment-divider" />
                <view className="projected-payment-row projected-payment-quality">
                  <text className="projected-payment-label">Quality Score</text>
                  <text className="projected-payment-value">{qualityMetrics?.score ?? '-'} / 100</text>
                </view>
                <text id="projected-payment-share-note">
                  {getCreatorShareText(qualityMetrics?.score)}
                </text>
              </view>
            </view>
          </view>
          <view className="projected-payment-breakdown">
            <text className="projected-payment-breakdown-title">Earnings Breakdown</text>
            <view className="projected-payment-breakdown-values">
              <view className="projected-payment-breakdown-values">
                <view className="projected-payment-row">
                  <text className="projected-payment-label">Total Coins</text>
                  <text className="projected-payment-value">{settlement?.totalCoins ?? '-'}</text>
                </view>
                <view className="projected-payment-row">
                  <text className="projected-payment-label">Gross Earnings</text>
                  <text className="projected-payment-value">{settlement?.totalUSD ?? '-'}</text>
                </view>
                <view className="projected-payment-row">
                  <text className="projected-payment-label">Platform Fee ({(1 - getCreatorShare(qualityMetrics?.score)) * 100 - 5}%)</text>
                  <text className="projected-payment-value">- {settlement?.platformAmountUSD ?? '-'}</text>
                </view>
                <view className="projected-payment-row">
                  <text className="projected-payment-label">Fraud Reserve (5%)</text>
                  <text className="projected-payment-value">- {settlement?.reserveAmountUSD ?? '-'}</text>
                </view>
                <view className="projected-payment-divider" />
                <view className="projected-payment-row projected-payment-final">
                  <text className="projected-payment-label">Final Payout</text>
                  <text className="projected-payment-value">{settlement?.creatorAmountUSD ?? '-'}</text>
                </view>
              </view>
            </view>
          </view>{!payoutCredited && (
            <text className="projected-payment-note">
              Amount will be credited after 48 hours
            </text>
          )}
          <view
            className="projected-payment-fastforward-button"
            style={{ opacity: payoutCredited ? 0.6 : 1, pointerEvents: payoutCredited ? 'none' : 'auto' }}
            bindtap={async () => {
                if (payoutCredited) return;
                try {
                  const res = await fetch(`http://localhost:4000/lives/${id}/fast-forward`, { method: 'POST' });
                  const data = await res.json();
                  if (data.ok) {
                    setPayoutCredited(true);
                    alert(`Payout of $${data.credited.toFixed(2)} credited to creator!`);
                    // Optionally refresh settlement info here
                  } else {
                    alert('Fast forward failed.');
                  }
                } catch (err) {
                  alert('Fast forward failed.');
                }
              }}
            >
            <text>{'</>'} Fast Forward</text>
          </view>
          {payoutCredited && (
            <text className="projected-payment-payout-credited">
              Payout has been credited to your account.
            </text>
          )}
        </view>
      )}
    </view>
  );
}