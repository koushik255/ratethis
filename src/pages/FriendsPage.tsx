import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import RetroLayout from "../components/RetroLayout";
import { useConvexAuth } from "convex/react";
import "./FriendsPage.css";

type Tab = "recent" | "friends" | "requests";

interface UserProfile {
  userId: string;
  displayName: string;
  username?: string;
  profilePicture?: string;
}

interface ReceivedFriendRequest {
  _id: string;
  senderId: string;
  senderDisplayName: string;
  senderProfilePicture?: string;
  createdAt: number;
}

interface SentFriendRequest {
  _id: string;
  receiverDisplayName: string;
  receiverProfilePicture?: string;
  createdAt: number;
}

interface SearchResult extends UserProfile {
  isFriend: boolean;
  requestStatus: "none" | "pending_sent" | "pending_received";
}

interface RecentActivityItem {
  friendId: string;
  friendName: string;
  friendUsername?: string;
  friendProfilePicture?: string;
  animeId: string;
  animeTitle: string;
  animePicture?: string;
  animeType: string;
  watchedAt?: number;
  watchedComment?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useConvexAuth();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const friends = useQuery(api.friends.getMyFriends);
  const requests = useQuery(api.friends.getFriendRequests);
  const recentActivity = useQuery(api.friends.getFriendsRecentActivity);
  const searchResults = useQuery(
    api.friends.searchUsers,
    debouncedSearchQuery.trim() ? { query: debouncedSearchQuery, limit: 20 } : "skip"
  );

  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const declineRequest = useMutation(api.friends.declineFriendRequest);
  const cancelRequest = useMutation(api.friends.cancelFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest({ receiverId: userId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send request");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest({ requestId: requestId as any });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineRequest({ requestId: requestId as any });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to decline request");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelRequest({ requestId: requestId as any });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to cancel request");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm("Remove this friend?")) return;
    try {
      await removeFriend({ friendId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove friend");
    }
  };

  const totalRequests = (requests?.received?.length || 0) + (requests?.sent?.length || 0);

  return (
    <RetroLayout>
      <div className="friends-view animate-fade-in">
        <div className="content-header">
          <h2 className="page-title">friends</h2>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "recent" ? "active" : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            recent
          </button>
          <button
            className={`tab ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            friends ({friends?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            requests {totalRequests > 0 && `(${totalRequests})`}
          </button>
        </div>

        <div className="friends-content card">
          {!isAuthenticated ? (
            <div className="empty-state">
              <p>sign in to manage friends</p>
            </div>
          ) : activeTab === "recent" ? (
            <RecentActivityTab activity={recentActivity} />
          ) : activeTab === "friends" ? (
            <FriendsTab
              friends={friends}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              onSendRequest={handleSendRequest}
              onRemoveFriend={handleRemoveFriend}
            />
          ) : (
            <RequestsTab
              requests={requests}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
              onCancel={handleCancelRequest}
            />
          )}
        </div>
      </div>
    </RetroLayout>
  );
}

function RecentActivityTab({ activity }: { activity: RecentActivityItem[] | undefined }) {
  if (activity === undefined) {
    return <div className="loading"><p>loading...</p></div>;
  }

  if (activity.length === 0) {
    return (
      <div className="empty-state">
        <p>no recent activity from friends</p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {activity.map((item) => (
        <div key={`${item.friendId}-${item.animeId}`} className="activity-item">
          <div className="activity-friend">
            <div className="friend-avatar">
              {item.friendProfilePicture ? (
                <img src={item.friendProfilePicture} alt={item.friendName} />
              ) : (
                <span>{item.friendName[0]}</span>
              )}
            </div>
            <div className="activity-friend-info">
              <span className="activity-friend-name">{item.friendName}</span>
              <span className="activity-date">
                {item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
          <Link to={`/anime/${item.animeId}`} className="activity-anime">
            {item.animePicture && (
              <img src={item.animePicture} alt={item.animeTitle} className="activity-anime-thumb" />
            )}
            <div className="activity-anime-info">
              <span className="activity-anime-title">{item.animeTitle}</span>
              <span className="activity-anime-type">{item.animeType}</span>
              {item.watchedComment && (
                <span className="activity-comment">"{item.watchedComment}"</span>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

function FriendsTab({
  friends,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSendRequest,
  onRemoveFriend,
}: {
  friends: UserProfile[] | undefined;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[] | undefined;
  onSendRequest: (userId: string) => void;
  onRemoveFriend: (userId: string) => void;
}) {
  return (
    <>
      <div className="search-section">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search users..."
          className="input"
        />
      </div>

      {searchQuery.trim() && searchResults !== undefined && (
        <div className="friends-section">
          <div className="section-bar"><span className="section-bar-title">search results</span></div>
          <div className="friends-list">
            {searchResults.length === 0 ? (
              <div className="empty-state"><p>no users found</p></div>
            ) : (
              searchResults.map((user) => (
                <FriendItem
                  key={user.userId}
                  user={user}
                  isFriend={user.isFriend}
                  requestStatus={user.requestStatus}
                  onSendRequest={() => onSendRequest(user.userId)}
                  onRemoveFriend={() => onRemoveFriend(user.userId)}
                />
              ))
            )}
          </div>
        </div>
      )}

      <div className="friends-section">
        <div className="section-bar"><span className="section-bar-title">my friends</span></div>
        {friends === undefined ? (
          <div className="loading"><p>loading...</p></div>
        ) : friends.length === 0 ? (
          <div className="empty-state"><p>no friends yet. search above to add friends!</p></div>
        ) : (
          <div className="friends-list">
            {friends.map((friend) => (
              <FriendItem
                key={friend.userId}
                user={friend}
                isFriend={true}
                requestStatus="none"
                onRemoveFriend={() => onRemoveFriend(friend.userId)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function RequestsTab({
  requests,
  onAccept,
  onDecline,
  onCancel,
}: {
  requests: { received: ReceivedFriendRequest[]; sent: SentFriendRequest[] } | undefined;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  if (requests === undefined) {
    return <div className="loading"><p>loading...</p></div>;
  }

  return (
    <>
      <div className="friends-section">
        <div className="section-bar"><span className="section-bar-title">received requests</span></div>
        {requests.received.length === 0 ? (
          <div className="empty-state"><p>no pending requests</p></div>
        ) : (
          <div className="friends-list">
            {requests.received.map((req) => (
              <div key={req._id} className="friend-item">
                <div className="friend-avatar">
                  {req.senderProfilePicture ? (
                    <img src={req.senderProfilePicture} alt={req.senderDisplayName} />
                  ) : (
                    <span>{req.senderDisplayName[0]}</span>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{req.senderDisplayName}</span>
                  <span className="friend-meta">sent {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="friend-actions">
                  <button className="btn btn-small" onClick={() => onAccept(req._id)}>accept</button>
                  <button className="btn btn-small" onClick={() => onDecline(req._id)}>decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="friends-section">
        <div className="section-bar"><span className="section-bar-title">sent requests</span></div>
        {requests.sent.length === 0 ? (
          <div className="empty-state"><p>no sent requests</p></div>
        ) : (
          <div className="friends-list">
            {requests.sent.map((req) => (
              <div key={req._id} className="friend-item">
                <div className="friend-avatar">
                  {req.receiverProfilePicture ? (
                    <img src={req.receiverProfilePicture} alt={req.receiverDisplayName} />
                  ) : (
                    <span>{req.receiverDisplayName[0]}</span>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{req.receiverDisplayName}</span>
                  <span className="friend-meta">sent {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="friend-actions">
                  <button className="btn btn-small" onClick={() => onCancel(req._id)}>cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FriendItem({
  user,
  isFriend,
  requestStatus,
  onSendRequest,
  onRemoveFriend,
}: {
  user: UserProfile;
  isFriend: boolean;
  requestStatus: "none" | "pending_sent" | "pending_received";
  onSendRequest?: () => void;
  onRemoveFriend?: () => void;
}) {
  return (
    <div className="friend-item">
      <div className="friend-avatar">
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.displayName} />
        ) : (
          <span>{user.displayName[0]}</span>
        )}
      </div>
      <div className="friend-info">
        {user.username ? (
          <Link to={`/profile/${user.username}`} className="friend-name">{user.displayName}</Link>
        ) : (
          <span className="friend-name">{user.displayName}</span>
        )}
        {user.username && <span className="friend-username">@{user.username}</span>}
      </div>
      <div className="friend-actions">
        {isFriend ? (
          <>
            <span className="friend-status">friends</span>
            {onRemoveFriend && (
              <button className="btn btn-small" onClick={onRemoveFriend}>remove</button>
            )}
          </>
        ) : requestStatus === "pending_sent" ? (
          <span className="friend-status">request sent</span>
        ) : requestStatus === "pending_received" ? (
          <span className="friend-status">pending</span>
        ) : (
          onSendRequest && <button className="btn btn-small" onClick={onSendRequest}>add</button>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
