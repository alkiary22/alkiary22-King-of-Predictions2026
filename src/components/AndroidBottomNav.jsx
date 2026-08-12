import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Crown, Trophy, Target, Home, User } from 'lucide-react-native';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from "../config/flags";
import { prefetchData } from "../hooks/usePrefetch";

const AndroidBottomNav = () => {
  const navigate = useNavigate();

  const handleChallengePress = () => {
    Alert.alert(
      "🔒 التحدي مغلق مؤقتاً",
      "سيتم إطلاق التحدي قريباً جداً.\n\nتابعنا ليصلك الإشعار فور الفتح!",
      [
        { 
          text: "حسناً", 
          style: "default" 
        }
      ]
    );
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/10 h-16 flex-row items-center justify-around px-2 z-50">
      
      <TouchableOpacity onPress={() => navigate('/')} className="items-center flex-1">
        <Home size={24} color="#888" />
        <Text className="text-[10px] text-gray-500 mt-1">الرئيسية</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate('/leaders')} className="items-center flex-1">
        <Trophy size={24} color="#888" />
        <Text className="text-[10px] text-gray-500 mt-1">المتصدرون</Text>
      </TouchableOpacity>

      {/* زر التحدي - مغلق مؤقتاً */}
      <TouchableOpacity 
        onPress={handleChallengePress}
        className="items-center -mt-8 flex-1"
      >
        <View className="bg-gradient-to-br from-yellow-400 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/50 border-4 border-[#0f0f0f]">
          <Crown size={34} color="#111" fill="#111" />
        </View>
        <Text className="text-xs font-bold text-yellow-400 mt-1 tracking-wider">التحدي</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate('/predictions')} className="items-center flex-1">
        <Target size={24} color="#888" />
        <Text className="text-[10px] text-gray-500 mt-1">توقعاتي</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate('/profile')} className="items-center flex-1">
        <User size={24} color="#888" />
        <Text className="text-[10px] text-gray-500 mt-1">حسابي</Text>
      </TouchableOpacity>

    </View>
  );
};


// 🔒 التحدي مغلق مؤقتاً
const __handleChallengeClick = (e) => {
  if (!FEATURES.challengeEnabled) {
    e.preventDefault();
    e.stopPropagation();
    alert("🔒 التحدي مغلق مؤقتاً");
    return false;
  }
  return true;
};


// 🚀 Prefetch عند لمس/تمرير على الرابط
const __prefetchOnHover = (path) => {
  const map = {
    "/": "/matches",
    "/matches": "/matches",
    "/leaderboard": "/leaderboard?period=weekly",
    "/leaders": "/leaderboard?period=weekly",
    "/competitions": "/competitions",
    "/tournaments": "/competitions",
  };
  const endpoint = map[path];
  if (endpoint) prefetchData(endpoint);
};

export default AndroidBottomNav;
