import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '@env'; 
import axios from 'axios'; 
import { addLog } from '../../../logService';
import { DataContext } from '../../../DataContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileImage: {
    width: 160, 
    height: 160, 
    borderRadius: 100, 
    borderWidth: 3,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  editIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  listItem: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  sectionTitle: {
    fontSize: 16,
    flex: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    color: '#000',
    paddingHorizontal: 5,
    fontSize: 16,
  }
});

const ProfileScreen = () => {
  const { identifier, password, name, email, saveCredentials, saveUserInfo, isDarkThemeEnabled } = useContext(DataContext); // DataContext에서 saveUserInfo 불러오기
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); 
  const [profile, setProfile] = useState({
    username: identifier || 'username',
    password: password || 'password',
    email: email || 'user@example.com',
    name: name || 'name',
  });
  const [originalProfile, setOriginalProfile] = useState({ ...profile });

  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        await addLog('프로필 페이지에 접속했습니다.');
      };
      logVisit();
    }, [])
  );

  const handleEdit = () => {
    if (isEditing) {
      setProfile({ ...originalProfile });
      setIsEditing(false);
    } else {
      setOriginalProfile({ ...profile });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!profile.username || !profile.password) {
      Alert.alert('오류', '사용자명과 비밀번호를 입력하세요.');
      return;
    }

    const modificationData = {
      username: profile.username,
      new_password: profile.password,
      new_email: profile.email,
      new_name: profile.name,
    };
  
    try {
      const response = await axios.post(`${API_BASE_URL}/user/modification.php`, modificationData, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      const data = response.data;
      if (data.StatusCode === 200) { // StatusCode가 200일 때 성공 처리
        saveCredentials(profile.username, profile.password);
        saveUserInfo(profile.name, profile.email); // name과 email도 저장
        Alert.alert('회원정보 수정', '회원정보가 수정되었습니다.');
      } else {
        Alert.alert('회원정보 수정 실패', data.message || '다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('회원정보 수정 중 오류:', error);
      Alert.alert('오류', '회원정보 수정 중 문제가 발생했습니다.');
    }
  
    setIsEditing(false);
    setOriginalProfile({ ...profile });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 회원 탈퇴를 하시겠습니까?',
      [
        { text: '아니오', onPress: () => console.log('탈퇴 취소'), style: 'cancel' },
        { text: '예', onPress: () => console.log('탈퇴 진행') },
      ],
      { cancelable: true }
    );
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkThemeEnabled ? '#333' : '#fff' }]}>
      <View style={styles.profileHeader}>
        <Image
          style={[styles.profileImage, { borderColor: isDarkThemeEnabled ? '#555' : '#ccc' }]}
          source={{ uri: 'https://via.placeholder.com/100' }}
        />
        <TouchableOpacity style={styles.editIcon} onPress={handleEdit}>
          <AntDesign
            name={isEditing ? 'close' : 'edit'}
            size={20}
            color={isDarkThemeEnabled ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      </View>

      {['username', 'password', 'email', 'name'].map((field, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            { backgroundColor: isDarkThemeEnabled ? '#444' : '#f8f8f8' },
          ]}
        >
          <View style={styles.sectionRow}>
            <View style={styles.iconContainer}>
              <AntDesign
                name={
                  field === 'username'
                    ? 'idcard'
                    : field === 'password'
                    ? 'lock1'
                    : field === 'email'
                    ? 'mail'
                    : 'user'
                }
                size={20}
                color={isDarkThemeEnabled ? '#fff' : '#000'}
              />
            </View>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.input, { color: isDarkThemeEnabled ? '#bbb' : '#000' }]}
                  value={profile[field]}
                  onChangeText={(value) => handleChange(field, value)}
                  secureTextEntry={field === 'password' && !isPasswordVisible} // 비밀번호 가시성 적용
                />
                {field === 'password' && (
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <AntDesign name={isPasswordVisible ? 'eye' : 'eyeo'} size={20} color={isDarkThemeEnabled ? '#fff' : '#000'} />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={[styles.sectionTitle, { color: isDarkThemeEnabled ? '#bbb' : '#000' }]}>
                {field === 'password' ? '********' : profile[field]} {/* 비밀번호 비가시 상태로 표시 */}
              </Text>
            )}
          </View>
        </View>
      ))}

      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>회원 탈퇴</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
