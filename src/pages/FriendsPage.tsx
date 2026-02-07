import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { useConvexAuth } from "convex/react";
import "./FriendsPage.css";

type Tab = "friends" | "requests";

interface UserProfile {
  userId: string;
  displayName: string;
  username?: string;
  profilePicture?: string;
}

interface ReceivedFriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: number;
  senderDisplayName: string;
  senderProfilePicture?: string;
}

interface SentFriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: number;
  receiverDisplayName: string;
  receiverProfilePicture?: string;
}

interface SearchResult extends UserProfile {
  isFriend: boolean;
  requestStatus: "none" | "pending_sent" | "pending_received";
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
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useConvexAuth();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const friends = useQuery(api.friends.getMyFriends);
  const requests = useQuery(api.friends.getFriendRequests);
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

  const UserProfileLink = ({ user, className = "" }: { user: UserProfile; className?: string }) => {
    if (user.username) {
      return (
        <Link to={`/profile/${user.username}`} className={`friend-name-link ${className}`}>
          {user.displayName}
        </Link>
      );
    }
    return <span className={`friend-name ${className}`}>{user.displayName}</span>;
  };

  return (
    <div className="board">
      <header className="board-header">
        <div className="header-left">
          <h1 className="site-title">analog</h1>
          <nav className="board-nav">
            <Link to="/">index</Link>
            <span className="nav-separator">/</span>
            <Link to="/profile">profile</Link>
            <span className="nav-separator">/</span>
            <Link to="/log">log</Link>
            <span className="nav-separator">/</span>
            <Link to="/forums">forums</Link>
            <span className="nav-separator">/</span>
            <Link to="/lists">lists</Link>
            <span className="nav-separator">/</span>
            <span className="nav-current">friends</span>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="friends-tabs">
        <button
          className={`friends-tab ${activeTab === "friends" ? "active" : ""}`}
          onClick={() => setActiveTab("friends")}
        >
          friends ({friends?.length || 0})
        </button>
        <button
          className={`friends-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          requests {totalRequests > 0 && `(${totalRequests})`}
        </button>
      </div>

      <div className="board-content">
        {!isAuthenticated ? (
          <div className="friends-auth-prompt">
            <p>please sign in to manage friends</p>
          </div>
        ) : activeTab === "friends" ? (
          <>
            <div className="friends-search">
              <input
                type="text"
                placeholder="search users by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="friends-search-input"
              />
            </div>

            {searchQuery.trim() && searchResults !== undefined && (
              <div className="friends-search-results">
                <h3 className="friends-section-title">search results</h3>
                {searchResults.length === 0 ? (
                  <p className="friends-empty">no users found</p>
                ) : (
                  <div className="friends-list">
                    {searchResults.map((user: SearchResult) => (
                      <div key={user.userId} className="friend-item">
                        <div className="friend-avatar">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.displayName}
                              className="friend-avatar-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="friend-avatar-placeholder">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="friend-info">
                          <UserProfileLink user={user} />
                          {user.username && (
                            <span className="friend-username">@{user.username}</span>
                          )}
                        </div>
                        <div className="friend-actions">
                          {user.isFriend ? (
                            <span className="friend-status">friends</span>
                          ) : user.requestStatus === "pending_sent" ? (
                            <span className="friend-status pending">request sent</span>
                          ) : user.requestStatus === "pending_received" ? (
                            <span className="friend-status pending">request pending</span>
                          ) : (
                            <button
                              className="friend-action-button"
                              onClick={() => handleSendRequest(user.userId)}
                            >
                              add friend
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="friends-list-section">
              <h3 className="friends-section-title">my friends</h3>
              {friends === undefined ? (
                <div className="loading">
                  <p>loading...</p>
                </div>
              ) : friends.length === 0 ? (
                <div className="friends-empty">
                  <p>no friends yet</p>
                  <p className="friends-hint">search for users above to add friends</p>
                </div>
              ) : (
                <div className="friends-list">
                  {friends.map((friend: UserProfile) => (
                    <div key={friend.userId} className="friend-item">
                      <div className="friend-avatar">
                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.displayName}
                            className="friend-avatar-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="friend-avatar-placeholder">
                            {friend.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                       <div className="friend-info">
                          <UserProfileLink user={friend} />
                          {friend.username && (
                            <span className="friend-username">@{friend.username}</span>
                          )}
                        </div>
                      <div className="friend-actions">
                        <button
                          className="friend-action-button remove"
                          onClick={() => handleRemoveFriend(friend.userId)}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="friends-requests">
            <div className="friends-requests-section">
              <h3 className="friends-section-title">received requests</h3>
              {requests === undefined ? (
                <div className="loading">
                  <p>loading...</p>
                </div>
              ) : requests.received.length === 0 ? (
                <p className="friends-empty">no pending requests</p>
              ) : (
                <div className="friends-list">
                  {requests.received.map((request: ReceivedFriendRequest) => (
                    <div key={request._id} className="friend-item">
                      <div className="friend-avatar">
                        {request.senderProfilePicture ? (
                          <img
                            src={request.senderProfilePicture}
                            alt={request.senderDisplayName}
                            className="friend-avatar-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="friend-avatar-placeholder">
                            {request.senderDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <span className="friend-name">{request.senderDisplayName}</span>
                        <span className="friend-meta">
                          sent {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="friend-actions">
                        <button
                          className="friend-action-button accept"
                          onClick={() => handleAcceptRequest(request._id)}
                        >
                          accept
                        </button>
                        <button
                          className="friend-action-button decline"
                          onClick={() => handleDeclineRequest(request._id)}
                        >
                          decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="friends-requests-section">
              <h3 className="friends-section-title">sent requests</h3>
              {requests === undefined ? (
                <div className="loading">
                  <p>loading...</p>
                </div>
              ) : requests.sent.length === 0 ? (
                <p className="friends-empty">no sent requests</p>
              ) : (
                <div className="friends-list">
                  {requests.sent.map((request: SentFriendRequest) => (
                    <div key={request._id} className="friend-item">
                      <div className="friend-avatar">
                        {request.receiverProfilePicture ? (
                          <img
                            src={request.receiverProfilePicture}
                            alt={request.receiverDisplayName}
                            className="friend-avatar-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="friend-avatar-placeholder">
                            {request.receiverDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <span className="friend-name">{request.receiverDisplayName}</span>
                        <span className="friend-meta">
                          sent {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="friend-actions">
                        <button
                          className="friend-action-button remove"
                          onClick={() => handleCancelRequest(request._id)}
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default FriendsPage;
