import '../styles/Home.css'
import { useState, useEffect, useRef } from '@lynx-js/react'
import { useNavigate } from 'react-router';
import { formatDateTime } from '../utils/format-date-time.tsx';
import capitalise from '../utils/capitalise.tsx';

type LiveSession = {
    id: string,
    creatorName: string,
    startAt: string,
    status: string,
}

export default function Home() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    // AI Chat state
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const inputRef = useRef();

    // Fetch live sessions from backend
    useEffect(() => {
        let timer: NodeJS.Timeout;
        const fetchSessions = async () => {
            try {
                setError(null);
                const res = await fetch('http://localhost:4000/lives');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setSessions(data);
            } catch (err) {
                setError('Could not load live sessions.');
                setSessions([]);
            } finally {
                setLoading(false);
            }
        }

        fetchSessions();

        timer = setInterval(fetchSessions, 5000);

        return () => clearInterval(timer);
    }, []);

    // Create new live session
    async function createLive() {
        setCreating(true)
        try {
            const resp = await fetch('http://localhost:4000/lives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: 'demo-creator',
                    startAt: new Date().toISOString(),
                }),
            });
            if (!resp.ok) throw new Error('Failed to create live');

            const live = await resp.json();
            setSessions(prev => [live, ...prev]);
        } catch (err) {
            setError('Failed to create live session.');
        } finally {
            setCreating(false);
        }
    }

    // AI Event handler
    async function handleSendChat() {
        if (!chatInput.trim()) return;
        setChatLoading(true);
        setChatResponse('');
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY', // <-- Replace with your key
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: chatInput }]
                })
            });
            const data = await res.json();
            setChatResponse(data.choices?.[0]?.message?.content || 'No response');
        } catch (err) {
            setChatResponse('Error contacting AI.');
        } finally {
            setChatLoading(false);
        }
    }

    return (
    <view className="home-container">
        <text className="home-title">Prism Ledger</text>
        <view className="home-actions">
            <view
                className="home-action-btn"
                aria-disabled={creating}
                bindtap={createLive}
            >
                {creating ? 'Creating...' : '+ Start New Live'}
            </view>
        </view>
        <view
            className="transparency-explorer-button"
            bindtap={() => navigate('/transparency')}
        >
            <text className="transparency-explorer-button-icon">⟐</text>
        </view>
        {loading ? (
        <text>Loading sessions...</text>
        ) : error ? (
        <text className="home-error">{error}</text>
        ) : (
        <scroll-view className="home-session-list" scroll-orientation="vertical">
            {sessions.length === 0 && (
            <text className="home-session-empty">No live sessions.</text>
            )}
            {sessions.map(session => (
            <view
                key={session.id}
                className="home-session-card"
                bindtap={() => navigate(`/live/${session.id}`)}
            >
                <text className="home-session-date">{formatDateTime(session.startAt)}</text>
                <text className="home-session-status">
                    Status:{" "}
                    <text className={`home-session-status-value ${session.status === 'ended' ? 'ended' : session.status === 'running' ? 'running' : ''}`}>
                        {capitalise(session.status)}
                    </text>
                </text>
            </view>
            ))}
        </scroll-view>
        )}
    </view>
    )
}
