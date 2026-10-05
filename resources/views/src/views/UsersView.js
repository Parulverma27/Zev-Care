/**
 * Users View (V) — presentation only. No API calls; uses UserController.
 */

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import useUserController from '../controllers/UserController';
import User from '../models/User';
import UserForm from '../components/UserForm';

function confirmDelete(onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm('Delete this user?')) onConfirm();
    return;
  }
  Alert.alert('Delete User', 'Delete this user?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function UsersView() {
  const {
    users,
    page,
    totalPages,
    loading,
    error,
    formVisible,
    formUser,
    setPage,
    openCreateForm,
    openEditForm,
    closeForm,
    saveUser,
    removeUser,
  } = useUserController();

  const renderUser = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowEmail}>{item.email}</Text>
        <Text style={styles.rowId}>ID: {item.id}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditForm(item)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(() => removeUser(item.id))}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Users</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateForm}>
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color="#1a1a1a" style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderUser}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
          />

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                onPress={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <Text style={styles.pageButtonText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                Page {page} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                onPress={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <Text style={styles.pageButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <UserForm
        visible={formVisible}
        user={User.isExisting(formUser) ? formUser : null}
        onSave={saveUser}
        onCancel={closeForm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#c00',
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rowEmail: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  rowId: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#fee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#c00',
    fontWeight: '500',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  pageButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  pageInfo: {
    color: '#555',
    fontSize: 14,
  },
});
