export function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    return `${day} ${month} ${year}, ${time}`;
}