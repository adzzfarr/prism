import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from '@lynx-js/react';
import '../styles/LiveSessionDashboard.css';
import { formatDateTime } from '../utils/format-date-time.tsx';
import capitalise from '../utils/capitalise.tsx';
import { FraudChart } from '../components/FraudChart.tsx';

type Gift = {
  id: string;
  consumer: {
    name: string;
  };
  coinAmount: number;
  timestamp: string;
  riskFlag?: boolean;
  recentGiftCount?: number;
};

type LiveSession = {
  id: string;
  creatorName: string;
  startAt: string;
  status: string;
  gifts: Gift[];
  fraudStats: {
    totalGifts: number,
    fraudCount: number,
    fraudUsers: number,
    fraudPercent: number,
  },
  qualityMetrics: {
    score: number,
    retention: number,
    engagement: number,
  },
};

export default function LiveSessionDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
  let interval: NodeJS.Timeout;
  setLoading(true);

  async function fetchSession() {
    try {
      const res = await fetch(`http://localhost:4000/lives/${id}`);
      const data = await res.json();
      setSession(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  fetchSession(); // Initial fetch
  interval = setInterval(fetchSession, 2000); // Poll every 2 seconds

  return () => clearInterval(interval);
}, [id]);

  const barChartData = session 
  ? [
    { label: 'Retention', value: session.qualityMetrics.retention, color: '#4287f5' },
    { label: 'Engagement', value: session.qualityMetrics.engagement, color: '#a07d1eff' },
  ]
  : [];

  return (
    <scroll-view className="dashboard-container" scroll-y>
      <text className="dashboard-back" bindtap={() => navigate('/home')}>← Home</text>
      <text className="dashboard-title">
        Live Dashboard
      </text>
      <view className="dashboard-content">
        {loading ? (
        <text className="dashboard-loading">Loading...</text>
        ) : session ? (
        <>
          <view className="dashboard-header">
            <view className="dashboard-header-info">
              <text className="dashboard-creator">{session.creatorName}'s Live</text>
              <text className="dashboard-status">
                Status:{" "}
                <text className={`dashboard-status-value ${session.status === 'ended' ? 'ended' : session.status === 'running' ? 'running' : ''}`}>
                  {capitalise(session.status)}
                </text>
              </text>
              <text className="dashboard-date">
                {formatDateTime(new Date(session.startAt).toISOString())}
              </text>
            </view>
            <view className="dashboard-header-actions">
              {session.status === 'running' && (
                <>
                  <view
                    className="dashboard-header-action-button"
                    bindtap={async () => {
                      setLoading(true);
                      const res = await fetch(`http://localhost:4000/lives/${id}/end`, { method: 'POST' });
                      const data = await res.json();
                      setSession({ ...session, status: 'ended', qualityMetrics: data.qualityMetrics });
                      setLoading(false);
                    }}
                  >
                    <text>End Live</text>
                  </view>
                </>
              )}
              {session.status === 'ended' && (
                <view
                  className="dashboard-header-action-button"
                  bindtap={() => navigate(`/projected-payment/${id}`)}
                >
                  <text>Show Projected Payment</text>
                </view>
              )}
            </view>
          </view>
          <view className="dashboard-summary">
            <text className="dashboard-summary-title">Session Summary</text>
            <text className="dashboard-summary-content">
              <view className='dashboard-summary-statistics'>
                <text className="dashboard-summary-score">
                  Quality Score: {session.qualityMetrics.score}
                </text>
                <text className="dashboard-summary-fraud">
                  { session.fraudStats && session.fraudStats.fraudPercent > 0
                    ? `Potential Fraud: ${session.fraudStats.fraudPercent}%`
                    : "No fraud detected!" }
                </text>
              </view>
            </text>
          </view>
          <view className="dashboard-bar-chart">
            <text className="dashboard-bar-title">Viewer Retention & Engagement</text>
            <view className="dashboard-bar-row">
              {barChartData.map(bar => (
                <view key={bar.label} className="dashboard-bar">
                  <view
                    className="dashboard-bar-fill"
                    style={{
                      width: `${bar.value * 100}%`,
                      background: bar.color,
                    }}
                  />
                  <text className="dashboard-bar-label">
                    {bar.label}: {Math.round(bar.value * 100)}%
                  </text>
                </view>
              ))}
            </view>
          </view>
          <view className="dashboard-fraud-chart">
            <text className="dashboard-fraud-chart-title">Gift Fraud Breakdown</text> 
            <FraudChart
              fraudCount={session.fraudStats.fraudCount}
              totalGifts={session.fraudStats.totalGifts}
              fraudUsers={session.fraudStats.fraudUsers}
            />
          </view>
          <scroll-view className="dashboard-gift-feed" scroll-y>
            <text className="dashboard-gift-title">Gift Feed</text>
            {session.gifts.length === 0 ? (
              <text className="dashboard-gift-empty">No gifts yet.</text>
            ) : (
              session.gifts.map(gift => (
                <view key={gift.id} className={`dashboard-gift-card${gift.riskFlag ? ' fraud' : ''}`}>
                  <view className="dashboard-gift-card-details">
                    <text className="dashboard-gift-sender">{gift.consumer.name}</text>
                    <text className="dashboard-gift-amount">{gift.coinAmount} coins</text>
                    <text className="dashboard-gift-time">
                      {new Date(gift.timestamp).toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </text>
                  </view>
                  {gift.riskFlag && (
                  <text className="dashboard-gift-fraud-reason-below">
                    ⚠ Potential Fraud: {getFraudReason(gift)}
                  </text>
                  )}
                </view>
              ))
            )}
          </scroll-view>
        </>
      ) : (
        <text className="dashboard-error">Session not found.</text>
      )}
      </view>
      {session && session.status === 'running' && (
        <view 
          className="dashboard-demo-button"
          bindtap={() => setShowDemoMenu(true)}
        >
          <text className="dashboard-demo-button-icon">{'</>'}</text>
        </view>
      )}
      {showDemoMenu && (
        <view className="dashboard-demo-menu">
          <view className="dashboard-demo-menu-content">
            <text className="dashboard-demo-menu-title">Demo Actions</text>
            <view className="dashboard-demo-menu-actions">
              <view
                className={`dashboard-demo-menu-button${demoLoading ? ' disabled' : ''}`}
                bindtap={async () => {
                  if (demoLoading) return;

                  setDemoLoading(true);
                  await fetch(`http://localhost:4000/demo/send-gift/${id}`, { method: 'POST' });
                  setDemoLoading(false);
                  setShowDemoMenu(false);
                }}
              >
                <text>Send Gift</text>
              </view>
              <view
                className={`dashboard-demo-menu-button${demoLoading ? ' disabled' : ''}`}
                bindtap={async () => {
                  if (demoLoading) return;

                  setDemoLoading(true);
                  await fetch(`http://localhost:4000/demo/send-multiple-gifts/${id}`, { method: 'POST' });
                  setDemoLoading(false);
                  setShowDemoMenu(false);
                }}
              >
                <text>Send Multiple Gifts</text>
              </view>
              <view
                className={`dashboard-demo-menu-button${demoLoading ? ' disabled' : ''}`}
                bindtap={async () => {
                  if (demoLoading) return;

                  setDemoLoading(true);
                  await fetch(`http://localhost:4000/demo/fraud-burst/${id}`, { method: 'POST' });
                  setDemoLoading(false);
                  setShowDemoMenu(false);
                }}
              >
                <text>Trigger Fraud Burst</text>
              </view>
              <view
                className="dashboard-demo-menu-button cancel"
                bindtap={() => setShowDemoMenu(false)}
              >
                <text>Cancel</text>
              </view>
            </view>
          </view>
        </view>
      )}
    </scroll-view>
  );
}

function getFraudReason(gift: Gift & { recentGiftCount?: number; consumer?: { kycStatus?: string } }) {
  if (gift.coinAmount > 1000) return "Large amount flagged as suspicious";
  if (gift.recentGiftCount && gift.recentGiftCount > 5) return "Too many gifts sent in a short period";
  if (gift.consumer?.kycStatus !== "verified") return "Sender is not verified";
  return "Flagged by risk assessment.";
}