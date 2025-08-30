export function FraudChart({ fraudCount, totalGifts, fraudUsers }: { fraudCount: number; totalGifts: number; fraudUsers: number; }) {
  const legitCount = totalGifts - fraudCount;
  const legitPercent = totalGifts === 0 ? 0 : Math.round(((totalGifts - fraudCount) / totalGifts) * 100);
  const fraudPercent = totalGifts === 0 ? 0 : Math.round((fraudCount / totalGifts) * 100);

  const chartColor = totalGifts === 0 ? '#888' : undefined;

  return (
    <view className="dashboard-fraud-chart-container">
      <view className="dashboard-fraud-chart-bar">
        <view
          className="dashboard-fraud-chart-legit"
          style={{
            width: `${legitPercent * 100}%`,
            background: chartColor || '#4caf50',
          }}
        />
        <view
          className="dashboard-fraud-chart-fraud"
          style={{
            width: `${fraudPercent * 100}%`,
          }}
        />
        <text className="dashboard-fraud-chart-label">
          Legitimate: {Math.round(legitPercent)}% &nbsp;|&nbsp; Fraudulent: {Math.round(fraudPercent)}%
        </text>
      </view>
      <text className="dashboard-fraud-chart-accounts">
        Potential Fraud Accounts: {fraudUsers}
      </text>
    </view>
  );
}