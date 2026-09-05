import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  User,
  ChatMessage,
  DrawStroke,
  ActiveGameState,
  FloatingReaction,
  GameType,
  FriendProfile
} from './types';
import { Navbar } from './components/Navbar';
import { LiveStage } from './components/LiveStage';
import { ChatPanel } from './components/ChatPanel';
import { GameHub } from './components/games/GameHub';
import { RoomModal } from './components/RoomModal';
import { ProfileModal } from './components/ProfileModal';
import { UserProfileCardModal } from './components/UserProfileCardModal';
import { FriendsModal } from './components/FriendsModal';
import {
  AVATAR_COLORS,
  AVATAR_ICONS,
  createAudioLevelDetector,
  triggerConfetti,
  triggerWinConfetti
} from './utils/mediaUtils';
import { sounds } from './utils/soundEffects';
import {
  Radio,
  Gamepad2,
  MessageSquare,
  Users,
  Heart,
  AlertCircle,
  X
} from 'lucide-react';

export default function App() {
  // Read initial room from URL query if present
  const getInitialRoomId = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) return r.toLowerCase().trim();
    } catch (e) {}
    return 'lounge-1';
  };

  // Profile in localStorage
  const getStoredProfile = () => {
    try {
      const saved = localStorage.getItem('hangout_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const randColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const randIcon = AVATAR_ICONS[Math.floor(Math.random() * AVATAR_ICONS.length)];
    const randNum = Math.floor(100 + Math.random() * 900);
    const randName = `Player_${randNum}`;
    const prof = {
      name: randName,
      username: `player_${randNum}`,
      avatarColor: randColor,
      avatarIcon: randIcon,
      avatarUrl: undefined,
      bio: 'Hey there! Ready to hangout and play party games.'
    };
    try {
      localStorage.setItem('hangout_user_profile', JSON.stringify(prof));
    } catch (e) {}
    return prof;
  };

  // Friends in localStorage
  const getStoredFriends = (): FriendProfile[] => {
    try {
      const saved = localStorage.getItem('hangout_friends_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  };

  const [roomId, setRoomId] = useState<string>(getInitialRoomId);
  const [profile, setProfile] = useState(getStoredProfile);
  const [friends, setFriends] = useState<FriendProfile[]>(getStoredFriends);
  const [isSoundMuted, setIsSoundMuted] = useState(sounds.getMuted());
  const [roomErrorMsg, setRoomErrorMsg] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<RoomState>({
    roomId: getInitialRoomId(),
    roomName: 'Chill Lounge & Chat',
    users: [],
    activeGame: null,
    recentMessages: [],
    canvasStrokes: [],
    hasPassword: false
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Media state
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<'stage' | 'game' | 'chat' | 'friends'>('stage');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const audioDetectorCleanupRef = useRef<(() => void) | null>(null);

  // Save friends helper
  const saveFriends = (newList: FriendProfile[]) => {
    setFriends(newList);
    try {
      localStorage.setItem('hangout_friends_list', JSON.stringify(newList));
    } catch (e) {}
  };

  // Toggle friend
  const handleToggleFriend = (targetUser: User) => {
    const isFriend = friends.some((f) => f.id === targetUser.id);
    if (isFriend) {
      saveFriends(friends.filter((f) => f.id !== targetUser.id));
    } else {
      const newFriend: FriendProfile = {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username || targetUser.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        avatarColor: targetUser.avatarColor,
        avatarIcon: targetUser.avatarIcon,
        avatarUrl: targetUser.avatarUrl,
        bio: targetUser.bio,
        isOnline: true,
        currentRoomId: roomState.roomId,
        addedAt: Date.now()
      };
      saveFriends([...friends, newFriend]);
    }
  };

  // Add friend by username
  const handleAddFriendByUsername = (username: string): boolean => {
    // Check if user is in current room
    const target = roomState.users.find(
      (u) =>
        u.username?.toLowerCase() === username.toLowerCase() ||
        u.name.toLowerCase() === username.toLowerCase()
    );
    if (target) {
      handleToggleFriend(target);
      return true;
    }
    return false;
  };

  // Send message helper
  const sendWs = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    let isSubscribed = true;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribed) return;
        setIsConnected(true);
        setRoomErrorMsg(null);

        // Join the room
        ws.send(
          JSON.stringify({
            type: 'join_room',
            roomId,
            user: {
              id: currentUser?.id,
              name: profile.name,
              username: profile.username,
              avatarColor: profile.avatarColor,
              avatarIcon: profile.avatarIcon,
              avatarUrl: profile.avatarUrl,
              bio: profile.bio,
              friends: friends.map((f) => f.id)
            }
          })
        );
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'join_error') {
            setRoomErrorMsg(data.message || 'Could not join room.');
            sounds.playError();
            return;
          }

          if (data.type === 'room_state') {
            setRoomState({
              roomId: data.roomId,
              roomName: data.roomName,
              users: data.users,
              activeGame: data.activeGame,
              recentMessages: data.recentMessages,
              canvasStrokes: data.canvasStrokes || [],
              hasPassword: data.hasPassword
            });
            const me = data.users.find((u: User) => u.id === data.yourUserId);
            if (me) setCurrentUser(me);
          } else if (data.type === 'user_joined') {
            sounds.playJoin();
            setRoomState((prev) => {
              if (prev.users.some((u) => u.id === data.user.id)) return prev;
              return { ...prev, users: [...prev.users, data.user] };
            });
          } else if (data.type === 'user_left') {
            setRoomState((prev) => ({
              ...prev,
              users: prev.users.filter((u) => u.id !== data.userId)
            }));
          } else if (data.type === 'user_updated') {
            setRoomState((prev) => ({
              ...prev,
              users: prev.users.map((u) => (u.id === data.user.id ? data.user : u))
            }));
            if (currentUser && data.user.id === currentUser.id) {
              setCurrentUser(data.user);
            }
          } else if (data.type === 'new_message') {
            setRoomState((prev) => ({
              ...prev,
              recentMessages: [...prev.recentMessages, data.message]
            }));
            if (data.message.type === 'correct_guess') {
              triggerConfetti();
              sounds.playSuccess();
            } else if (data.message.senderId !== currentUser?.id) {
              sounds.playMessage();
            }
          } else if (data.type === 'message_reaction_updated') {
            setRoomState((prev) => ({
              ...prev,
              recentMessages: prev.recentMessages.map((m) =>
                m.id === data.messageId ? { ...m, reactions: data.reactions } : m
              )
            }));
          } else if (data.type === 'floating_reaction') {
            const reaction: FloatingReaction = data.reaction;
            setFloatingReactions((prev) => [...prev, reaction]);
            sounds.playReaction();
            setTimeout(() => {
              setFloatingReactions((prev) =>
                prev.filter((r) => r.id !== reaction.id)
              );
            }, 3000);
          } else if (data.type === 'game_started' || data.type === 'game_updated') {
            setRoomState((prev) => ({
              ...prev,
              activeGame: data.game
            }));
            if (data.game?.status === 'revealing' || data.game?.status === 'completed') {
              triggerWinConfetti();
              sounds.playWin();
            }
          } else if (data.type === 'game_ended') {
            setRoomState((prev) => ({
              ...prev,
              activeGame: null,
              canvasStrokes: []
            }));
          } else if (data.type === 'game_timer_tick') {
            setRoomState((prev) => {
              if (!prev.activeGame) return prev;
              return {
                ...prev,
                activeGame: {
                  ...prev.activeGame,
                  timeLeft: data.timeLeft
                } as ActiveGameState
              };
            });
          } else if (data.type === 'draw_stroke') {
            setRoomState((prev) => ({
              ...prev,
              canvasStrokes: [...prev.canvasStrokes, data.stroke]
            }));
          } else if (data.type === 'canvas_cleared') {
            setRoomState((prev) => ({
              ...prev,
              canvasStrokes: []
            }));
          }
        } catch (err) {
          console.error('Error handling WS event:', err);
        }
      };

      ws.onclose = () => {
        if (!isSubscribed) return;
        setIsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [roomId]);

  // Audio level detection when mic is live
  useEffect(() => {
    if (isMicOn && localStream) {
      audioDetectorCleanupRef.current = createAudioLevelDetector(
        localStream,
        (isSpeaking) => {
          sendWs({
            type: 'toggle_media',
            isSpeaking
          });
          setCurrentUser((prev) => (prev ? { ...prev, isSpeaking } : null));
        }
      );
    } else {
      if (audioDetectorCleanupRef.current) {
        audioDetectorCleanupRef.current();
        audioDetectorCleanupRef.current = null;
      }
      sendWs({
        type: 'toggle_media',
        isSpeaking: false
      });
      setCurrentUser((prev) => (prev ? { ...prev, isSpeaking: false } : null));
    }

    return () => {
      if (audioDetectorCleanupRef.current) {
        audioDetectorCleanupRef.current();
      }
    };
  }, [isMicOn, localStream, sendWs]);

  // Camera toggle handler
  const handleToggleCam = async () => {
    sounds.playClick();
    if (isCamOn) {
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => track.stop());
      }
      setIsCamOn(false);
      sendWs({ type: 'toggle_media', isCamOn: false });
      setCurrentUser((prev) => (prev ? { ...prev, isCamOn: false } : null));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 15 },
          audio: false
        });
        setLocalStream((prev) => {
          if (prev) {
            const combined = new MediaStream([
              ...prev.getAudioTracks(),
              ...stream.getVideoTracks()
            ]);
            return combined;
          }
          return stream;
        });
        setIsCamOn(true);
        sendWs({ type: 'toggle_media', isCamOn: true });
        setCurrentUser((prev) => (prev ? { ...prev, isCamOn: true } : null));
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
      }
    }
  };

  // Microphone toggle handler
  const handleToggleMic = async () => {
    sounds.playClick();
    if (isMicOn) {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => track.stop());
      }
      setIsMicOn(false);
      sendWs({ type: 'toggle_media', isMicOn: false, isSpeaking: false });
      setCurrentUser((prev) =>
        prev ? { ...prev, isMicOn: false, isSpeaking: false } : null
      );
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false
        });
        setLocalStream((prev) => {
          if (prev) {
            const combined = new MediaStream([
              ...prev.getVideoTracks(),
              ...stream.getAudioTracks()
            ]);
            return combined;
          }
          return stream;
        });
        setIsMicOn(true);
        sendWs({ type: 'toggle_media', isMicOn: true });
        setCurrentUser((prev) => (prev ? { ...prev, isMicOn: true } : null));
      } catch (err) {
        console.warn('Microphone access denied or unavailable:', err);
      }
    }
  };

  // Reactions
  const handleSendReaction = (emoji: string) => {
    sendWs({ type: 'floating_reaction', emoji });
  };

  // Chat message
  const handleSendMessage = (text: string) => {
    sendWs({ type: 'chat_message', text });
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    sounds.playClick();
    sendWs({ type: 'message_reaction', messageId, emoji });
  };

  // Game control handlers
  const handleStartGame = (gameType: GameType) => {
    sounds.playSuccess();
    sendWs({ type: 'start_game', gameType });
  };

  const handleEndGame = () => {
    sounds.playClick();
    sendWs({ type: 'end_game' });
  };

  const handleSendStroke = (stroke: DrawStroke) => {
    sendWs({ type: 'draw_stroke', stroke });
  };

  const handleClearCanvas = () => {
    sendWs({ type: 'clear_canvas' });
  };

  const handleSubmitGuess = (text: string) => {
    sendWs({ type: 'chat_message', text });
  };

  const handleSubmitTriviaAnswer = (answerIndex: number) => {
    sounds.playClick();
    sendWs({ type: 'trivia_answer', answerIndex });
  };

  const handleDropConnectFourToken = (col: number) => {
    sounds.playClick();
    sendWs({ type: 'connect_four_drop', col });
  };

  const handleJoinConnectFour = (slot: 1 | 2) => {
    sounds.playClick();
    sendWs({ type: 'connect_four_join', slot });
  };

  // Room switch
  const handleJoinRoom = (newRoomId: string, roomName?: string, passcode?: string) => {
    setRoomErrorMsg(null);
    setRoomId(newRoomId);
    window.history.replaceState(null, '', `?room=${encodeURIComponent(newRoomId)}`);
    sendWs({
      type: 'join_room',
      roomId: newRoomId,
      passcode,
      user: {
        id: currentUser?.id,
        name: profile.name,
        username: profile.username,
        avatarColor: profile.avatarColor,
        avatarIcon: profile.avatarIcon,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio
      }
    });
    setRoomState((prev) => ({
      ...prev,
      roomId: newRoomId,
      roomName: roomName || `Room #${newRoomId.toUpperCase()}`,
      activeGame: null,
      recentMessages: []
    }));
  };

  // Profile save
  const handleSaveProfile = (newProfileData: {
    name: string;
    username: string;
    avatarColor: string;
    avatarIcon: string;
    avatarUrl?: string;
    bio?: string;
  }) => {
    setProfile(newProfileData);
    try {
      localStorage.setItem('hangout_user_profile', JSON.stringify(newProfileData));
    } catch (e) {}

    sendWs({
      type: 'update_profile',
      ...newProfileData
    });

    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            ...newProfileData
          }
        : null
    );
  };

  // Sound toggle
  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsSoundMuted(muted);
  };

  // Inspect user profile
  const handleViewUserProfile = (user: User) => {
    sounds.playClick();
    setViewingUser(user);
  };

  const handleViewSenderProfile = (senderId: string) => {
    const target = roomState.users.find((u) => u.id === senderId);
    if (target) {
      sounds.playClick();
      setViewingUser(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-20 lg:pb-0 font-sans">
      {/* Top Navigation */}
      <Navbar
        roomState={roomState}
        currentUser={currentUser}
        isConnected={isConnected}
        friendCount={friends.length}
        isMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
        onOpenGameSelector={() => handleEndGame()}
      />

      {/* Room Error Banner */}
      {roomErrorMsg && (
        <div className="bg-red-950/90 border-b border-red-800 text-red-200 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span>{roomErrorMsg}</span>
          </div>
          <button
            onClick={() => setRoomErrorMsg(null)}
            className="p-1 rounded hover:bg-red-900/50 text-red-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main App Layout: Responsive Desktop Split vs Mobile Tabs */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* Left / Center: Live Stage & Party Games */}
          <div
            className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-4 min-h-0 ${
              mobileTab === 'stage' || mobileTab === 'game' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Live Audio / Video Hangout Stage */}
            <div className={mobileTab === 'game' ? 'hidden lg:block' : 'block'}>
              <LiveStage
                users={roomState.users}
                currentUser={currentUser}
                localStream={localStream}
                isCamOn={isCamOn}
                isMicOn={isMicOn}
                floatingReactions={floatingReactions}
                onToggleCam={handleToggleCam}
                onToggleMic={handleToggleMic}
                onSendReaction={handleSendReaction}
                onViewProfile={handleViewUserProfile}
              />
            </div>

            {/* Party Games Hub */}
            <div
              className={`flex-1 min-h-[380px] sm:min-h-[440px] ${
                mobileTab === 'stage' ? 'hidden lg:block' : 'block'
              }`}
            >
              <GameHub
                activeGame={roomState.activeGame}
                currentUser={currentUser}
                users={roomState.users}
                canvasStrokes={roomState.canvasStrokes}
                onStartGame={handleStartGame}
                onEndGame={handleEndGame}
                onSendStroke={handleSendStroke}
                onClearCanvas={handleClearCanvas}
                onSubmitGuess={handleSubmitGuess}
                onSubmitTriviaAnswer={handleSubmitTriviaAnswer}
                onDropConnectFourToken={handleDropConnectFourToken}
                onJoinConnectFour={handleJoinConnectFour}
              />
            </div>
          </div>

          {/* Right: Real-time Group Chat & Live Game Guesses */}
          <div
            className={`lg:col-span-5 xl:col-span-4 h-[580px] lg:h-auto min-h-0 ${
              mobileTab === 'chat' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ChatPanel
              messages={roomState.recentMessages}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onReactMessage={handleReactMessage}
              activeGameType={roomState.activeGame?.gameType}
              onViewSenderProfile={handleViewSenderProfile}
            />
          </div>

          {/* Mobile Friends View */}
          {mobileTab === 'friends' && (
            <div className="lg:hidden col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <Heart size={18} className="text-pink-400" />
                  Friends List ({friends.length})
                </h3>
                <button
                  onClick={() => setIsFriendsModalOpen(true)}
                  className="text-xs bg-indigo-600 px-3 py-1.5 rounded-xl font-semibold text-white"
                >
                  Manage Friends
                </button>
              </div>

              <div className="space-y-2">
                {friends.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    No friends added yet. Tap on any player in the stage or chat to view their profile and add them!
                  </p>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => {
                        const inRoomUser = roomState.users.find((u) => u.id === friend.id);
                        handleViewUserProfile(
                          inRoomUser || {
                            id: friend.id,
                            name: friend.name,
                            username: friend.username,
                            avatarColor: friend.avatarColor,
                            avatarIcon: friend.avatarIcon,
                            avatarUrl: friend.avatarUrl,
                            bio: friend.bio,
                            isHost: false,
                            isCamOn: false,
                            isMicOn: false,
                            isSpeaking: false,
                            score: 0
                          }
                        );
                      }}
                      className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs" style={{ backgroundColor: friend.avatarColor }}>
                          {friend.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-200">{friend.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{friend.username || 'user'}</div>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-400 font-medium">View Profile</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile iOS Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-lg px-2 py-2 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => {
            sounds.playClick();
            setMobileTab('stage');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileTab === 'stage'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Radio size={19} />
            {isCamOn && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            )}
          </div>
          <span className="text-[10px]">Stage</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setMobileTab('game');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileTab === 'game'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Gamepad2 size={19} />
            {roomState.activeGame && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px]">Games</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setMobileTab('chat');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileTab === 'chat'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare size={19} />
            {roomState.recentMessages.length > 0 && (
              <span className="absolute -top-1 -right-1.5 text-[9px] font-bold bg-indigo-600 text-white px-1 rounded-full">
                {roomState.recentMessages.length > 99 ? '99+' : roomState.recentMessages.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Chat</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setMobileTab('friends');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileTab === 'friends'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Heart size={19} />
            {friends.length > 0 && (
              <span className="absolute -top-1 -right-1.5 text-[9px] font-bold bg-pink-600 text-white px-1 rounded-full">
                {friends.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Friends</span>
        </button>
      </div>

      {/* Modals */}
      <RoomModal
        isOpen={isRoomModalOpen}
        currentRoomId={roomState.roomId}
        onClose={() => setIsRoomModalOpen(false)}
        onJoinRoom={handleJoinRoom}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      <FriendsModal
        isOpen={isFriendsModalOpen}
        friends={friends}
        roomUsers={roomState.users}
        currentRoomId={roomState.roomId}
        onClose={() => setIsFriendsModalOpen(false)}
        onRemoveFriend={(friendId) => saveFriends(friends.filter((f) => f.id !== friendId))}
        onAddFriendByUsername={handleAddFriendByUsername}
        onSelectFriend={(friend) => {
          const inRoomUser = roomState.users.find((u) => u.id === friend.id);
          setViewingUser(
            inRoomUser || {
              id: friend.id,
              name: friend.name,
              username: friend.username,
              avatarColor: friend.avatarColor,
              avatarIcon: friend.avatarIcon,
              avatarUrl: friend.avatarUrl,
              bio: friend.bio,
              isHost: false,
              isCamOn: false,
              isMicOn: false,
              isSpeaking: false,
              score: 0
            }
          );
        }}
        onInviteFriend={(friend) => {
          handleSendMessage(`Hey @${friend.username || friend.name}, join my hangout in ${roomState.roomName}!`);
        }}
      />

      <UserProfileCardModal
        user={viewingUser}
        isOpen={Boolean(viewingUser)}
        isSelf={viewingUser?.id === currentUser?.id}
        isFriend={Boolean(viewingUser && friends.some((f) => f.id === viewingUser.id))}
        onClose={() => setViewingUser(null)}
        onToggleFriend={(targetUser) => handleToggleFriend(targetUser)}
        onMentionUser={(username) => {
          setMobileTab('chat');
          handleSendMessage(`@${username} `);
        }}
        onEditSelfProfile={() => setIsProfileModalOpen(true)}
      />
    </div>
  );
}
