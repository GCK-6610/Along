import { useState } from "react";
import {
  Search,
  MapPin,
  Bell,
  Home,
  Compass,
  Plus,
  MessageCircle,
  User,
  Clock,
  Users,
  Star,
  ChevronRight,
  Zap,
  Filter,
  Heart,
  Check,
  Send,
  ArrowLeft,
  ShieldCheck,
  Award,
  BookOpen,
} from "lucide-react";

// Initial categories matching the Explore tab grid
const CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "badminton", label: "Badminton", emoji: "🏸" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "cycling", label: "Cycling", emoji: "🚴" },
  { id: "hiking", label: "Hiking", emoji: "🥾" },
];

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    category: "badminton",
    title: "Morning Badminton",
    host: "Arjun M.",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=340&fit=crop&auto=format",
    location: "Siri Fort Sports Complex",
    time: "Tomorrow, 7:00 AM",
    distance: "1.2 km",
    spots: 2,
    totalSpots: 4,
    rating: 4.8,
    tags: ["Intermediate", "Outdoor"],
    joined: false,
    exactSpot: "Court #2, next to the clubhouse entrance.",
  },
  {
    id: 2,
    category: "shopping",
    title: "Weekend Mall Run",
    host: "Priya S.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=340&fit=crop&auto=format",
    location: "Select CITYWALK, Saket",
    time: "Sat, 11:00 AM",
    distance: "3.4 km",
    spots: 3,
    totalSpots: 5,
    rating: 4.6,
    tags: ["Casual", "Fun"],
    joined: false,
    exactSpot: "Meeting outside Zara entrance (Ground Floor).",
  },
  {
    id: 3,
    category: "running",
    title: "5K Dawn Run",
    host: "Rohan K.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
    image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=340&fit=crop&auto=format",
    location: "Lodhi Gardens",
    time: "Today, 6:00 AM",
    distance: "0.8 km",
    spots: 4,
    totalSpots: 8,
    rating: 4.9,
    tags: ["Beginner OK", "5K"],
    joined: true,
    exactSpot: "Gathering by the main parking gate at Lodhi Gardens.",
  },
  {
    id: 4,
    category: "yoga",
    title: "Sunrise Yoga Flow",
    host: "Meera T.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=340&fit=crop&auto=format",
    location: "India Gate Lawns",
    time: "Sun, 6:30 AM",
    distance: "2.1 km",
    spots: 5,
    totalSpots: 10,
    rating: 4.7,
    tags: ["All Levels", "Outdoor"],
    joined: false,
    exactSpot: "Lawn Area 3, opposite the canopy memorial.",
  },
  {
    id: 5,
    category: "hiking",
    title: "Aravalli Trail Hike",
    host: "Siddharth V.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=340&fit=crop&auto=format",
    location: "Aravalli Biodiversity Park",
    time: "Sat, 7:30 AM",
    distance: "5.6 km",
    spots: 1,
    totalSpots: 6,
    rating: 4.9,
    tags: ["Moderate", "3 hrs"],
    joined: false,
    exactSpot: "Main security gate at the park entrance.",
  },
  {
    id: 6,
    category: "cycling",
    title: "Sunday Cycling Crew",
    host: "Ananya R.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=340&fit=crop&auto=format",
    location: "Kartavya Path",
    time: "Sun, 5:30 AM",
    distance: "4.2 km",
    spots: 6,
    totalSpots: 12,
    rating: 4.5,
    tags: ["All welcome", "20 km"],
    joined: false,
    exactSpot: "Near the cycling track start line (Vijay Chowk side).",
  },
];

const NEARBY_PEOPLE = [
  {
    id: 1,
    name: "Kiran B.",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&auto=format",
    activity: "Badminton",
    distance: "0.4 km",
    mutual: 3,
    online: true,
  },
  {
    id: 2,
    name: "Divya N.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&auto=format",
    activity: "Yoga",
    distance: "0.9 km",
    mutual: 1,
    online: true,
  },
  {
    id: 3,
    name: "Aakash P.",
    avatar: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=80&h=80&fit=crop&auto=format",
    activity: "Running",
    distance: "1.1 km",
    mutual: 5,
    online: false,
  },
  {
    id: 4,
    name: "Sneha M.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format",
    activity: "Shopping",
    distance: "1.6 km",
    mutual: 2,
    online: true,
  },
];

// Simple list of sponsors for suggestions
const SPONSORS = [
  {
    id: 1,
    name: "PlayAll Sports Arena",
    location: "Gachibowli, Hyderabad",
    description: "Perfect court venue for badminton doubles. Open till midnight.",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Starbucks Coffee",
    location: "Sarath City Mall, Gachibowli",
    description: "Ideal workspace with high-speed Wi-Fi & quiet corners.",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Decathlon Sports Hub",
    location: "Saket, New Delhi",
    description: "Wide range of gear. Starting point for morning running crews.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop&auto=format",
  },
];

const BOTTOM_NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "create", label: "", icon: Plus },
  { id: "messages", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: User },
];

const renderAvatar = (avatarStr: string, sizeClass = "w-6 h-6", roundedClass = "rounded-full") => {
  if (avatarStr.startsWith("http")) {
    return (
      <img
        src={avatarStr}
        alt="Avatar"
        className={`${sizeClass} ${roundedClass} object-cover border-2 border-white`}
      />
    );
  }
  return (
    <div className={`${sizeClass} ${roundedClass} bg-red-100 border-2 border-white flex items-center justify-center text-xs font-bold leading-none`}>
      {avatarStr}
    </div>
  );
};

const PROFANITY_LIST = ["fuck", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "vulgar", "abuse", "spam"];
const isProfane = (text: string) => {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some(word => lower.includes(word));
};

export default function App() {
  const [activitiesList, setActivitiesList] = useState(INITIAL_ACTIVITIES);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeNav, setActiveNav] = useState("home");
  const [joinedMap, setJoinedMap] = useState<Record<number, boolean>>(
    Object.fromEntries(INITIAL_ACTIVITIES.map((a) => [a.id, a.joined]))
  );
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState("🦊");
  const [selectedAvatarType, setSelectedAvatarType] = useState<"avatar" | "image">("avatar");

  // Explore tab states
  const [exploreTab, setExploreTab] = useState<"interest" | "time" | "trending" | "nearby">("interest");
  const [selectedExploreCategory, setSelectedExploreCategory] = useState<string | null>(null);

  // Create overlay form states
  const [createStep, setCreateStep] = useState<0 | 1>(0);
  const [nlpInput, setNlpInput] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("running");
  const [newTime, setNewTime] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newExactSpot, setNewExactSpot] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [newVibeTags, setNewVibeTags] = useState<string[]>([]);
  const [newVisibility, setNewVisibility] = useState("public");

  // Chat message logs
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [checkedInMap, setCheckedInMap] = useState<Record<number, boolean>>({});
  const [chatMessages, setChatMessages] = useState<Record<number, Array<{ sender: string; text: string; time: string }>>>({
    3: [
      { sender: "Rohan K.", text: "Hey! Ready for the 5K Dawn Run today?", time: "5:45 AM" },
      { sender: "Me", text: "Yep, reached Lodhi Gardens. Where are you standing?", time: "5:50 AM" },
      { sender: "Rohan K.", text: "Standing right outside the main gate, wearing a yellow windbreaker.", time: "5:51 AM" },
    ],
  });
  const [messageText, setMessageText] = useState("");

  // Profile history toggle
  const [profileHistoryTab, setProfileHistoryTab] = useState<"upcoming" | "past">("past");

  const filteredActivities =
    activeCategory === "all"
      ? activitiesList
      : activitiesList.filter((a) => a.category === activeCategory);

  const featured = filteredActivities.slice(0, 2);
  const rest = filteredActivities.slice(2);

  const toggleJoin = (id: number) => {
    setJoinedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLike = (id: number) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mock NLP text parser simulation
  const handleNlpParse = () => {
    setErrorMsg(null);
    if (isProfane(nlpInput)) {
      setErrorMsg("Inappropriate or vulgar language detected in AI description. Please keep it clean.");
      return;
    }

    const text = nlpInput.toLowerCase();
    let title = "Tag-Along Activity";
    let cat = "running";
    let time = "Tomorrow, 7:00 AM";
    let venue = "Local Venue";
    let tags: string[] = ["Casual"];

    if (text.includes("run") || text.includes("running")) {
      title = "Morning Run";
      cat = "running";
      tags = ["Cardio", "Outdoor"];
    } else if (text.includes("badminton") || text.includes("court")) {
      title = "Badminton Doubles";
      cat = "badminton";
      tags = ["Intermediate", "Sports"];
    } else if (text.includes("cycling") || text.includes("cycle")) {
      title = "Morning Cycling";
      cat = "cycling";
      tags = ["Cardio", "Outdoor"];
    } else if (text.includes("shopping") || text.includes("zara") || text.includes("mall")) {
      title = "Shopping Trip";
      cat = "shopping";
      tags = ["Fun", "Casual"];
    } else if (text.includes("yoga") || text.includes("meditation")) {
      title = "Sunrise Yoga Flow";
      cat = "yoga";
      tags = ["All levels", "Outdoor"];
    }

    if (text.includes("narsingi")) {
      venue = "Narsingi Cycle Track, Hyderabad";
    } else if (text.includes("siri fort")) {
      venue = "Siri Fort Sports Complex, Delhi";
    } else if (text.includes("lodhi")) {
      venue = "Lodhi Gardens, Delhi";
    } else if (text.includes("sarath city")) {
      venue = "Sarath City Capital Mall, Hyderabad";
    } else if (text.includes("india gate")) {
      venue = "India Gate Lawns, Delhi";
    }

    if (text.includes("tomorrow")) {
      time = "Tomorrow, 6:30 AM";
    } else if (text.includes("wednesday")) {
      time = "Wednesday, 5:00 PM";
    } else if (text.includes("today")) {
      time = "Today, 4:00 PM";
    }

    setNewTitle(title);
    setNewCategory(cat);
    setNewTime(time);
    setNewVenue(venue);
    setNewVibeTags(tags);
    setCreateStep(0); // Take the user back to the primary form step with filled details!
    setNlpInput("");
  };

  const handlePublishPlan = () => {
    setErrorMsg(null);
    if (!newTitle.trim()) return;

    if (isProfane(newTitle) || isProfane(newVenue) || isProfane(newExactSpot)) {
      setErrorMsg("Inappropriate or vulgar language detected in form fields. Please revise.");
      return;
    }

    const newActivity = {
      id: activitiesList.length + 1,
      category: newCategory,
      title: newTitle,
      host: "Rahul D.",
      avatar: selectedAvatarType === "avatar" ? userAvatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
      image:
        newCategory === "badminton"
          ? "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=340&fit=crop&auto=format"
          : newCategory === "running"
          ? "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=340&fit=crop&auto=format"
          : "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=340&fit=crop&auto=format",
      location: newVenue || "Local Spot",
      time: newTime || "Tomorrow, 9:00 AM",
      distance: "0.2 km",
      spots: newCapacity,
      totalSpots: newCapacity,
      rating: 5.0,
      tags: [...newVibeTags, newVisibility === "verified" ? "Verified" : "Public"],
      joined: true,
      exactSpot: newExactSpot || "Meet near the entrance gate.",
    };

    setActivitiesList((prev) => [newActivity, ...prev]);
    setJoinedMap((prev) => ({ ...prev, [newActivity.id]: true }));
    setActiveNav("home");
    setCreateStep(0);
    setNlpInput("");
  };

  const handleSendMessage = (activityId: number) => {
    if (!messageText.trim()) return;

    const newMsg = {
      sender: "Me",
      text: messageText,
      time: "Just now",
    };

    setChatMessages((prev) => ({
      ...prev,
      [activityId]: [...(prev[activityId] || []), newMsg],
    }));
    setMessageText("");
  };

  return (
    <div
      className="min-h-screen bg-neutral-100 flex items-start justify-center"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="w-full max-w-md mx-auto bg-white min-h-screen relative pb-24 shadow-2xl border-x border-neutral-200">
        
        {/* ===================== VIEW 1: HOME TABS ===================== */}
        {activeNav === "home" && (
          <>
            {/* Header */}
            <div className="px-5 pt-12 pb-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    Good morning 👋
                  </p>
                  <h1 className="text-2xl font-black text-neutral-900 leading-tight">
                    Find your partner
                  </h1>
                </div>
                <div className="relative">
                  <button className="w-11 h-11 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center shadow-sm hover:bg-neutral-100 transition-colors">
                    <Bell size={20} className="text-neutral-700" />
                  </button>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">3</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 mb-5">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    placeholder="Search activity or location..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition"
                  />
                </div>
                <button className="w-13 h-13 px-4 rounded-2xl bg-red-500 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                  <Filter size={18} className="text-white" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5 ml-1">
                <MapPin size={12} className="text-red-500" />
                <span className="text-xs text-neutral-500 font-bold">
                  New Delhi, India
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2.5 px-5 overflow-x-auto scrollbar-hide mb-6 pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat.id
                      ? "bg-red-500 text-white shadow-md scale-105"
                      : "bg-neutral-50 border border-neutral-200 text-neutral-700 hover:border-red-500/30"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Happening Near You */}
            {featured.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between px-5 mb-3">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-red-500 fill-red-500" />
                    <h2 className="text-base font-black text-neutral-900">
                      Happening Near You
                    </h2>
                  </div>
                  <button className="flex items-center gap-0.5 text-xs font-bold text-red-500">
                    See all <ChevronRight size={14} />
                  </button>
                </div>

                <div className="flex gap-4 px-5 overflow-x-auto scrollbar-hide pb-1">
                  {featured.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex-shrink-0 w-72 bg-white rounded-3xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-40 bg-neutral-100">
                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <button
                          onClick={() => toggleLike(activity.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110"
                        >
                          <Heart
                            size={15}
                            className={
                              likedMap[activity.id]
                                ? "fill-red-500 text-red-500"
                                : "text-white"
                            }
                          />
                        </button>
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {activity.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-sm text-neutral-800 leading-tight">
                              {activity.title}
                            </h3>
                            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                              <MapPin size={10} /> {activity.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 text-xs font-bold text-neutral-800 ml-2">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            {activity.rating}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderAvatar(activity.avatar, "w-6 h-6")}
                            <span className="text-xs text-neutral-500 font-bold">
                              {activity.host}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleJoin(activity.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              joinedMap[activity.id]
                                ? "bg-green-100 text-green-700"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {joinedMap[activity.id] ? "✓ Joined" : "Join"}
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock size={11} /> {activity.time}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Users size={11} /> {activity.spots}/{activity.totalSpots} spots
                          </span>
                        </div>
                        <div className="mt-2.5 w-full bg-neutral-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-red-500 transition-all"
                            style={{
                              width: `${((activity.totalSpots - activity.spots) / activity.totalSpots) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Active People */}
            <div className="px-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-neutral-900">
                  Active Nearby
                </h2>
                <button className="flex items-center gap-0.5 text-xs font-semibold text-red-500">
                  See all <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {NEARBY_PEOPLE.map((person) => (
                  <button
                    key={person.id}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-neutral-100 group-hover:border-red-500 transition-colors">
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {person.online && (
                        <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-neutral-800 leading-tight text-center">
                      {person.name}
                    </p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                      {person.activity}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* More Activities */}
            {rest.length > 0 && (
              <div className="px-5 pb-6">
                <h2 className="text-base font-bold text-neutral-900 mb-3">
                  More Activities
                </h2>
                <div className="flex flex-col gap-3">
                  {rest.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 bg-white border border-neutral-200 rounded-2xl p-3.5 hover:shadow-sm transition-shadow"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-sm text-neutral-800 truncate pr-2">
                            {activity.title}
                          </h3>
                          <div className="flex items-center gap-0.5 flex-shrink-0 text-xs font-bold">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="text-neutral-800">{activity.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={9} /> {activity.location}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-semibold">
                            <Clock size={9} /> {activity.time}
                          </span>
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-semibold">
                            <Users size={9} /> {activity.spots} left
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            {renderAvatar(activity.avatar, "w-5 h-5")}
                            <span className="text-[10px] text-neutral-400 font-bold">
                              {activity.host}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleJoin(activity.id)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              joinedMap[activity.id]
                                ? "bg-green-50 text-green-700 flex items-center gap-1"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {joinedMap[activity.id] ? "✓ Joined" : "Join"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===================== VIEW 2: EXPLORE TAB ===================== */}
        {activeNav === "explore" && (
          <div className="px-5 pt-12 pb-6">
            <h1 className="text-2xl font-black text-neutral-900 leading-tight mb-1">
              Explore
            </h1>
            <p className="text-xs text-neutral-400 font-bold mb-4">
              Discover what's happening around you
            </p>

            {/* Search Bar */}
            <div className="relative mb-5">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search by plan, place, or interest..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Switcher tabs */}
            <div className="flex bg-neutral-100 rounded-xl p-1 mb-6">
              {(["interest", "time", "trending", "nearby"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setExploreTab(tab);
                    setSelectedExploreCategory(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-colors ${
                    exploreTab === tab
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {tab === "interest" ? "By Interest" : tab === "time" ? "By Time" : tab}
                </button>
              ))}
            </div>

            {/* By Interest Category Grid */}
            {exploreTab === "interest" && !selectedExploreCategory && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id: "badminton", label: "Sports", icon: "🏅", count: 24 },
                    { id: "coffee", label: "Food & Coffee", icon: "☕", count: 18 },
                    { id: "entertainment", label: "Entertainment", icon: "🎭", count: 12 },
                    { id: "shopping", label: "Shopping", icon: "🛍️", count: 9 },
                    { id: "yoga", label: "Outdoor", icon: "🌿", count: 15 },
                    { id: "hiking", label: "Learning", icon: "📚", count: 7 },
                  ].map((gridItem) => (
                    <button
                      key={gridItem.id}
                      onClick={() => setSelectedExploreCategory(gridItem.id)}
                      className="bg-white border border-neutral-200 rounded-2xl p-4 text-left shadow-sm hover:border-red-500/30 transition-colors"
                    >
                      <span className="text-2xl">{gridItem.icon}</span>
                      <h3 className="font-bold text-sm text-neutral-800 mt-2 leading-tight">
                        {gridItem.label}
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-bold mt-0.5">
                        {gridItem.count} active plans
                      </p>
                    </button>
                  ))}
                </div>

                {/* Featured Sponsors Horizontal Carousel */}
                <div className="mb-4">
                  <h2 className="text-base font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
                    🎁 Suggested Hotspots
                  </h2>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {SPONSORS.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex-shrink-0 w-64 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
                      >
                        <div className="h-28 bg-neutral-100">
                          <img
                            src={sp.image}
                            alt={sp.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs text-neutral-800">{sp.name}</h4>
                            <span className="px-1.5 py-0.5 text-[8px] bg-red-50 text-red-500 font-black rounded-md">PARTNER</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={9} /> {sp.location}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-semibold leading-tight mt-1.5 border-t border-dashed border-neutral-100 pt-1.5">
                            {sp.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Filtered category drill-down */}
            {selectedExploreCategory && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedExploreCategory(null)}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold hover:text-neutral-800"
                  >
                    <ArrowLeft size={14} /> Back to grid
                  </button>
                  <span className="text-xs font-bold text-red-500 capitalize">
                    {selectedExploreCategory} plans
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {activitiesList
                    .filter((a) => a.category === selectedExploreCategory)
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 bg-white border border-neutral-200 rounded-2xl p-3.5"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                          <img
                            src={activity.image}
                            alt={activity.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-neutral-800 truncate">
                            {activity.title}
                          </h3>
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                            {activity.location}
                          </p>
                          <div className="flex justify-between items-center mt-2.5">
                            <span className="text-[10px] text-neutral-400 font-semibold">
                              {activity.time}
                            </span>
                            <button
                              onClick={() => toggleJoin(activity.id)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                                joinedMap[activity.id]
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {joinedMap[activity.id] ? "✓ Joined" : "Join"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {activitiesList.filter((a) => a.category === selectedExploreCategory).length === 0 && (
                    <p className="text-center text-xs text-neutral-400 py-12">No plans found in this category.</p>
                  )}
                </div>
              </div>
            )}

            {/* By Time bucket filters */}
            {exploreTab === "time" && (
              <div className="flex flex-col gap-3">
                {["Happening Now", "Today", "Tomorrow", "This Weekend"].map((timeBucket) => (
                  <div key={timeBucket} className="border border-neutral-200 rounded-2xl p-4 bg-white shadow-sm">
                    <h3 className="font-bold text-sm text-neutral-800 mb-2">{timeBucket}</h3>
                    <p className="text-xs text-neutral-400 font-medium">
                      {timeBucket === "Happening Now" ? "2 plans nearby active right now" : "Tap to browse schedules"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Trending Tab */}
            {exploreTab === "trending" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 mb-2 flex-wrap">
                  {["#badminton", "#running", "#zara", "#ikea", "#southsush"].map((t) => (
                    <span key={t} className="px-2.5 py-1 text-xs bg-red-50 text-red-500 rounded-full font-bold">
                      {t}
                    </span>
                  ))}
                </div>
                {activitiesList.slice(0, 3).map((act) => (
                  <div key={act.id} className="border border-neutral-200 rounded-2xl p-4 flex justify-between items-center bg-white">
                    <div>
                      <h4 className="font-bold text-sm text-neutral-800">{act.title}</h4>
                      <p className="text-[11px] text-neutral-400 font-bold">{act.location}</p>
                    </div>
                    <span className="text-xs text-red-500 font-black">{act.spots} slots left</span>
                  </div>
                ))}
              </div>
            )}

            {/* Map Placeholder */}
            {exploreTab === "nearby" && (
              <div className="relative border border-neutral-200 rounded-2xl h-80 overflow-hidden bg-neutral-100 shadow-sm flex items-center justify-center">
                <div className="absolute inset-0 bg-neutral-200" />
                {/* Proximity circles */}
                <div className="relative w-44 h-44 rounded-full border border-red-400 bg-red-500/10 flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md" />
                </div>
                <div className="absolute top-1/4 left-1/3 p-2 bg-white rounded-full shadow-lg border border-neutral-200 text-base">🏸</div>
                <div className="absolute bottom-1/4 right-1/4 p-2 bg-white rounded-full shadow-lg border border-neutral-200 text-base">🏃</div>
                <div className="absolute top-1/2 right-1/3 p-2 bg-white rounded-full shadow-lg border border-neutral-200 text-base">☕</div>
                <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg">
                  📍 Interactive proximity map
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 3: CREATE OVERLAY TABS ===================== */}
        {activeNav === "create" && (
          <div className="px-5 pt-12 pb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-black text-neutral-900 leading-tight">
                Create a Plan
              </h1>
              <button
                onClick={() => {
                  setActiveNav("home");
                  setCreateStep(0);
                  setErrorMsg(null);
                }}
                className="text-xs text-neutral-400 hover:text-neutral-700 font-bold"
              >
                Close
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2 shadow-sm">
                <span className="font-extrabold">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 0: Create Form (Primary) */}
            {createStep === 0 && (
              <div className="space-y-4">
                {/* Secondary AI Option */}
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-wide">💡 Got a quick draft?</h4>
                    <p className="text-[10px] text-neutral-500 font-bold mt-0.5">Let AI extract location, time, and details.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCreateStep(1); // open AI description input
                      setErrorMsg(null);
                    }}
                    className="px-3.5 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-black shadow-sm transition"
                  >
                    Fill with AI ⚡
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Activity Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Morning Badminton"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 bg-neutral-50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-800 bg-neutral-50 focus:outline-none"
                    >
                      <option value="running">🏃 Running</option>
                      <option value="badminton">🏸 Badminton</option>
                      <option value="shopping">🛍️ Shopping</option>
                      <option value="yoga">🧘 Yoga</option>
                      <option value="cycling">🚴 Cycling</option>
                      <option value="hiking">🥾 Hiking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Scheduled Time</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="e.g. Tomorrow, 7:00 AM"
                      className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 bg-neutral-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Venue Location</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Siri Fort Sports Complex"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 bg-neutral-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">
                    🔒 Exact Meeting Spot (Secret - shown on accept)
                  </label>
                  <input
                    type="text"
                    value={newExactSpot}
                    onChange={(e) => setNewExactSpot(e.target.value)}
                    placeholder="e.g., Court #2, next to the clubhouse desk."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 bg-neutral-50 focus:outline-none placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                    Max Capacity Slots: {newCapacity}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2">Visibility Settings</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={newVisibility === "public"}
                        onChange={() => setNewVisibility("public")}
                        className="accent-red-500"
                      />
                      Public (Everyone)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                      <input
                        type="radio"
                        name="visibility"
                        value="verified"
                        checked={newVisibility === "verified"}
                        onChange={() => setNewVisibility("verified")}
                        className="accent-red-500"
                      />
                      Verified Only (Identity Match Badge)
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePublishPlan}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl shadow-lg transition"
                  >
                    Publish Tag-Along Intent
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1: AI Parser (Secondary Option) */}
            {createStep === 1 && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setCreateStep(0);
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 font-bold"
                  >
                    <ArrowLeft size={14} /> Back to Form
                  </button>
                </div>
                <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">
                  Describe what you are planning to do
                </label>
                <textarea
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder="e.g., Planning to hit the Narsingi Cycle track tomorrow morning at 6:30 AM. Wanna tag along?"
                  rows={4}
                  className="w-full border border-neutral-200 rounded-2xl p-4 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-neutral-50 mb-4 resize-none leading-relaxed"
                />
                <button
                  onClick={handleNlpParse}
                  disabled={!nlpInput.trim()}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl shadow-lg transition disabled:opacity-50"
                >
                  ⚡ Parse with AI & Autofill
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 4: MESSAGES & CHAT TABS ===================== */}
        {activeNav === "messages" && (
          <div className="pt-12 pb-6 min-h-screen flex flex-col">
            
            {/* List Chat logs state */}
            {selectedChatId === null && (
              <div className="px-5 flex-1">
                <h1 className="text-2xl font-black text-neutral-900 leading-tight mb-1">
                  Inbox
                </h1>
                <p className="text-xs text-neutral-400 font-bold mb-5">
                  Coordinate meetings with matched partners
                </p>

                <div className="flex flex-col gap-3">
                  {activitiesList
                    .filter((a) => joinedMap[a.id])
                    .map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => setSelectedChatId(activity.id)}
                        className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl p-4 text-left hover:border-red-500/20 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {renderAvatar(activity.avatar, "w-12 h-12 text-xl", "rounded-2xl")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-bold text-sm text-neutral-800 truncate pr-2">
                              {activity.title}
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-medium flex-shrink-0">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">
                            📍 {activity.location}
                          </p>
                          <p className="text-xs text-red-500 mt-1.5 font-bold flex items-center gap-1">
                            <MessageCircle size={12} /> Open temporary chat room
                          </p>
                        </div>
                      </button>
                    ))}
                  {activitiesList.filter((a) => joinedMap[a.id]).length === 0 && (
                    <div className="text-center py-16">
                      <span className="text-4xl">💬</span>
                      <p className="text-sm font-bold text-neutral-800 mt-2">No active chats</p>
                      <p className="text-xs text-neutral-400 mt-1">Join a plan to unlock communication.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat room viewport details */}
            {selectedChatId !== null && (() => {
              const activePlan = activitiesList.find((a) => a.id === selectedChatId);
              if (!activePlan) return null;
              const messages = chatMessages[selectedChatId] || [];

              return (
                <div className="flex-1 flex flex-col h-full bg-white relative">
                  {/* Chat header */}
                  <div className="px-5 pb-3.5 border-b border-neutral-100 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChatId(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-50 border border-neutral-200"
                    >
                      <ArrowLeft size={16} className="text-neutral-700" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-neutral-800 truncate">{activePlan.title}</h3>
                      <p className="text-[10px] text-neutral-400 font-bold truncate flex items-center gap-0.5">
                        <MapPin size={9} /> {activePlan.location} • {activePlan.time}
                      </p>
                    </div>
                  </div>

                  {/* Secret coordination spot display */}
                  <div className="mx-5 my-4 bg-red-50 border border-red-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1.5">
                      🔒 COORDINATION SPOT UNLOCKED
                    </h4>
                    <p className="text-xs text-neutral-700 leading-relaxed mt-1 font-semibold">
                      "{activePlan.exactSpot}"
                    </p>

                    {/* Proximity checkin component details */}
                    <div className="mt-3.5 pt-3.5 border-t border-red-200/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                        <span className="text-[11px] font-bold text-neutral-700">
                          {checkedInMap[activePlan.id] ? "Checked In ✔" : "Checking proximity..."}
                        </span>
                      </div>
                      <button
                        onClick={() => setCheckedInMap((prev) => ({ ...prev, [activePlan.id]: true }))}
                        disabled={checkedInMap[activePlan.id]}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all ${
                          checkedInMap[activePlan.id]
                            ? "bg-green-100 text-green-700"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {checkedInMap[activePlan.id] ? "At Venue" : "I'm Here"}
                      </button>
                    </div>
                  </div>

                  {/* Chat logs messages */}
                  <div className="flex-1 px-5 space-y-3.5 overflow-y-auto max-h-[350px] scrollbar-hide py-2">
                    {messages.map((m, idx) => {
                      const isMe = m.sender === "Me";
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <span className="text-[9px] text-neutral-400 font-bold mb-0.5 px-1">{m.sender}</span>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-semibold shadow-sm ${
                              isMe ? "bg-red-500 text-white" : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {m.text}
                          </div>
                          <span className="text-[8px] text-neutral-400 font-medium mt-0.5 px-1">{m.time}</span>
                        </div>
                      );
                    })}
                    {messages.length === 0 && (
                      <p className="text-center text-xs text-neutral-400 py-12">No messages. Start coordinating!</p>
                    )}
                  </div>

                  {/* Message Input box */}
                  <div className="p-4 border-t border-neutral-100 bg-white flex gap-2">
                    <input
                      type="text"
                      placeholder="Type coordination message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-800 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSendMessage(activePlan.id)}
                      className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md text-white transition-colors"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================== VIEW 5: USER PROFILE TAB ===================== */}
        {activeNav === "profile" && (
          <div className="pb-6">
            {/* Cover and header details */}
            <div className="relative h-44 bg-neutral-200">
              <img
                src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=300&fit=crop&auto=format"
                alt="Banner trail"
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-10 left-5">
                <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-4 border-white bg-neutral-100 flex items-center justify-center shadow-md">
                  {selectedAvatarType === "avatar" ? (
                    <span className="text-4xl">{userAvatar}</span>
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&auto=format"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
              </div>
            </div>

            {/* Profile info fields */}
            <div className="px-5 pt-12">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-neutral-900 leading-tight">Rahul D.</h2>
                <span className="px-2 py-0.5 text-[9px] bg-green-50 text-green-700 font-bold border border-green-200 rounded-md flex items-center gap-0.5">
                  <ShieldCheck size={9} /> Verified
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 font-bold flex items-center gap-1">
                <MapPin size={11} className="text-red-500" /> Vasant Vihar, New Delhi
              </p>
              <p className="text-xs text-neutral-600 mt-3 font-semibold leading-relaxed">
                Runner, reader, occasional badminton player. Always down for good coffee.
              </p>

              {/* Avatar Selector configuration */}
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                  Configure Profile Picture
                </label>
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => setSelectedAvatarType("avatar")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedAvatarType === "avatar"
                        ? "bg-red-50 border-red-500 text-red-500"
                        : "bg-neutral-50 border-neutral-200 text-neutral-500"
                    }`}
                  >
                    Illustration Avatar
                  </button>
                  <button
                    onClick={() => setSelectedAvatarType("image")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedAvatarType === "image"
                        ? "bg-red-50 border-red-500 text-red-500"
                        : "bg-neutral-50 border-neutral-200 text-neutral-500"
                    }`}
                  >
                    Custom Photo (Future V2)
                  </button>
                </div>

                {selectedAvatarType === "avatar" && (
                  <div className="flex gap-2.5 bg-neutral-50 p-2 rounded-2xl border border-neutral-200 overflow-x-auto scrollbar-hide">
                    {["🦊", "🐼", "🦁", "🐯", "🐨", "🐸", "🏃", "🏸", "☕"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setUserAvatar(emoji)}
                        className={`flex-shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-transform hover:scale-110 ${
                          userAvatar === emoji ? "bg-white border-2 border-red-500 shadow-sm" : "bg-neutral-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats row column metrics */}
            <div className="mx-5 my-5 border border-neutral-200 rounded-2xl bg-neutral-50/50 p-4 grid grid-cols-3 divide-x divide-neutral-200 text-center shadow-sm">
              <div>
                <p className="text-lg font-black text-neutral-800">6</p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Hosted</p>
              </div>
              <div>
                <p className="text-lg font-black text-neutral-800">21</p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Joined</p>
              </div>
              <div>
                <p className="text-lg font-black text-neutral-800">6</p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Badges</p>
              </div>
            </div>

            {/* Hobby Tag Capsules */}
            <div className="flex flex-wrap gap-2 px-5 mb-5">
              {["Running", "Badminton", "Coffee", "Books", "Photography"].map((chip) => (
                <span
                  key={chip}
                  className="px-3 py-1 text-xs border border-red-500/20 text-red-500 rounded-full font-bold bg-red-50/10"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Badges Locker Grid */}
            <div className="px-5 mb-6">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-3">
                Achievements & Badges
              </h3>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { title: "Identity Verified", badge: "🛡️", desc: "Government ID Match Check" },
                  { title: "Early Adopter", badge: "🚀", desc: "Joined during Beta launch" },
                  { title: "Goal Getter", badge: "🎯", desc: "Completed 5+ hosted plans" },
                  { title: "Active Mover", badge: "💪", desc: "Completed 5+ physical run plans" },
                ].map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-neutral-50/80 border border-neutral-100 rounded-xl p-3"
                  >
                    <span className="text-2xl">{b.badge}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-800 truncate leading-snug">{b.title}</p>
                      <p className="text-[9px] text-neutral-400 font-bold leading-none mt-0.5 truncate">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intents history logs */}
            <div className="px-5">
              {/* Tab selector */}
              <div className="flex border-b border-neutral-200 mb-4">
                <button
                  onClick={() => setProfileHistoryTab("upcoming")}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${
                    profileHistoryTab === "upcoming"
                      ? "border-red-500 text-red-500 font-black"
                      : "border-transparent text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  Upcoming Intents
                </button>
                <button
                  onClick={() => setProfileHistoryTab("past")}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${
                    profileHistoryTab === "past"
                      ? "border-red-500 text-red-500 font-black"
                      : "border-transparent text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  Past completed (14)
                </button>
              </div>

              {/* Tab details content display */}
              {profileHistoryTab === "upcoming" && (
                <div className="flex flex-col gap-3">
                  {activitiesList
                    .filter((a) => joinedMap[a.id])
                    .map((act) => (
                      <div
                        key={act.id}
                        className="border border-neutral-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-neutral-800">{act.title}</h4>
                          <p className="text-xs text-neutral-400 mt-0.5 font-medium">{act.time} • {act.location}</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-red-50 text-red-500 rounded-md font-bold">JOINED</span>
                      </div>
                    ))}
                </div>
              )}

              {profileHistoryTab === "past" && (
                <div className="flex flex-col gap-3">
                  {[
                    { title: "IKEA Run — Need One More", time: "Sat, 11:00 AM • IKEA Gurugram", badge: "🛍️" },
                    {
                      title: "Aravalli Sunrise Hike",
                      time: "Sun, 5:30 AM • Aravalli Biodiversity Park",
                      badge: "🥾",
                    },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="border border-neutral-200 rounded-2xl p-4 bg-white shadow-sm flex gap-3.5 items-center"
                    >
                      <span className="text-2xl">{p.badge}</span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-neutral-800 truncate leading-snug">{p.title}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5 font-medium truncate">{p.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== BOTTOM NAVIGATION TAB BAR ===================== */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-5 pt-2 z-50">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-xl flex items-center justify-around px-2 py-2">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              const isCreate = item.id === "create";
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.id === "create") {
                      setCreateStep(0); // reset create flow whenever overlay is clicked
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 transition-all ${
                    isCreate ? "relative -top-5" : ""
                  }`}
                >
                  {isCreate ? (
                    <div className="w-14 h-14 rounded-2xl bg-red-500 shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors">
                      <Plus size={24} className="text-white stroke-[3]" />
                    </div>
                  ) : (
                    <>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isActive ? "bg-red-50" : "hover:bg-neutral-50"
                        }`}
                      >
                        <Icon
                          size={20}
                          className={isActive ? "text-red-500" : "text-neutral-400"}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />
                      </div>
                      {item.label && (
                        <span
                          className={`text-[10px] font-bold ${
                            isActive ? "text-red-500" : "text-neutral-400"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
