// HomeScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FAB, Provider } from 'react-native-paper';
import UploadModal from '../Modal/UploadModal';
import BookmarkModal from '../Modal/BookmarkModal';
import SearchModal from '../Modal/SearchModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

const HomeScreen = () => {
  const [open, setOpen] = useState(false);
  const [visibleModal, setVisibleModal] = useState(null); // 모달 상태

  const showModal = (modalType) => setVisibleModal(modalType);
  const hideModal = () => setVisibleModal(null);

  return (
    <Provider>
      <View style={styles.container}>
        <Text>홈 화면입니다. 로그인 성공!</Text>
      </View>

      {/* 각각의 모달을 컴포넌트로 분리 */}
      <UploadModal visible={visibleModal === 'upload'} hideModal={hideModal} />
      <BookmarkModal visible={visibleModal === 'bookmark'} hideModal={hideModal} />
      <SearchModal visible={visibleModal === 'search'} hideModal={hideModal} />

      {/* FAB 그룹 */}
      <FAB.Group
        open={open}
        icon={open ? 'close' : 'plus'}
        actions={[
          {
            icon: 'upload',
            label: '파일 업로드',
            onPress: () => showModal('upload'),
          },
          {
            icon: 'bookmark',
            label: '나의 저장모음',
            onPress: () => showModal('bookmark'),
          },
          {
            icon: 'magnify',
            label: '검색',
            onPress: () => showModal('search'),
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        onPress={() => {
          if (open) {
            console.log('FAB 그룹 열림');
          }
        }}
      />
    </Provider>
  );
};

export default HomeScreen;
