import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  const { isDarkThemeEnabled } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: 'username',
    password: 'password',
    email: 'user@example.com',
    name: 'name',
  });
  // 원본 프로필 데이터를 저장할 상태 추가
  const [originalProfile, setOriginalProfile] = useState({...profile});

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
      // 편집 모드를 끄고 원래 데이터로 복원
      setProfile({...originalProfile});
      setIsEditing(false);
    } else {
      // 편집 모드를 켜고 현재 데이터를 원본으로 저장
      setOriginalProfile({...profile});
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // 저장 시 현재 데이터를 원본 데이터로 설정
    setOriginalProfile({...profile});
    Alert.alert('회원정보 수정', '회원정보가 수정되었습니다.');
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
            name={isEditing ? "close" : "edit"} 
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
              <TextInput
                style={[styles.input, { color: isDarkThemeEnabled ? '#bbb' : '#000' }]}
                value={profile[field]}
                onChangeText={(value) => handleChange(field, value)}
                secureTextEntry={field === 'password'}
              />
            ) : (
              <Text style={[styles.sectionTitle, { color: isDarkThemeEnabled ? '#bbb' : '#000' }]}>
                {profile[field]}
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