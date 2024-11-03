// ProfileScreen.js
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { addLog } from '../../../logService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderColor: '#ccc',
  },
  profileName: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  editIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  listItem: {
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
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
    color: '#000',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  }
});

const ProfileScreen = () => {
  useFocusEffect(
    useCallback(() => {
      const logVisit = async () => {
        await addLog('프로필 페이지에 접속했습니다.');
      };
      logVisit();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          style={styles.profileImage}
          source={{ uri: 'https://via.placeholder.com/100' }} // 프로필 사진 URL
        />
        <Text style={styles.profileName}></Text>
        <TouchableOpacity style={styles.editIcon}>
          <AntDesign name="edit" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.listItem}>
        <View style={styles.sectionRow}>
          <View style={styles.iconContainer}>
            <AntDesign name="idcard" size={20} color="#000" />
          </View>
          <Text style={styles.sectionTitle}>이름 : </Text>
        </View>
      </View>

      <View style={styles.listItem}>
        <View style={styles.sectionRow}>
          <View style={styles.iconContainer}>
            <AntDesign name="lock1" size={20} color="#000" />
          </View>
          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
        </View>
      </View>
      
      <View style={styles.listItem}>
        <View style={styles.sectionRow}>
          <View style={styles.iconContainer}>
            <AntDesign name="mail" size={20} color="#000" />
          </View>
          <Text style={styles.sectionTitle}>이메일: </Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileScreen;
