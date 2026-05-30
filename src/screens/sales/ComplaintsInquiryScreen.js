import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useGetComplaintsQuery } from '@api/complaintApi';

const ComplaintsInquiryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    data: responseData,
    isLoading,
    refetch,
    isFetching,
  } = useGetComplaintsQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('default'); // 'default', 'priority-hl', 'priority-lh', 'status'
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // Parse complaints list from API response
  const complaints = useMemo(() => {
    return responseData?.data || [];
  }, [responseData]);

  // Calculate status counts dynamically
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(
      c => (c.status || '').toLowerCase() === 'pending',
    ).length;
    const inProgress = complaints.filter(
      c =>
        (c.status || '').toLowerCase() === 'in progress' ||
        (c.status || '').toLowerCase() === 'in-progress',
    ).length;
    const resolved = complaints.filter(
      c => (c.status || '').toLowerCase() === 'resolved',
    ).length;

    return { total, pending, inProgress, resolved };
  }, [complaints]);

  // Filter complaints based on search query
  const filteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return complaints;
    const query = searchQuery.toLowerCase();
    return complaints.filter(
      c =>
        (c.ticket_id || '').toLowerCase().includes(query) ||
        (c.customer_name || '').toLowerCase().includes(query) ||
        (c.lineman_name || '').toLowerCase().includes(query) ||
        (c.status || '').toLowerCase().includes(query) ||
        (c.package_type || '').toLowerCase().includes(query),
    );
  }, [complaints, searchQuery]);

  // Sort complaints
  const sortedComplaints = useMemo(() => {
    const data = [...filteredComplaints];
    if (selectedSort === 'default') return data;

    const priorityWeight = { high: 3, medium: 2, low: 1, unknown: 0 };
    const statusWeight = {
      pending: 3,
      'in progress': 2,
      'in-progress': 2,
      resolved: 1,
    };

    if (selectedSort === 'priority-hl') {
      return data.sort((a, b) => {
        const wA = priorityWeight[(a.priority || '').toLowerCase()] || 0;
        const wB = priorityWeight[(b.priority || '').toLowerCase()] || 0;
        return wB - wA;
      });
    }

    if (selectedSort === 'priority-lh') {
      return data.sort((a, b) => {
        const wA = priorityWeight[(a.priority || '').toLowerCase()] || 0;
        const wB = priorityWeight[(b.priority || '').toLowerCase()] || 0;
        return wA - wB;
      });
    }

    if (selectedSort === 'status') {
      return data.sort((a, b) => {
        const wA = statusWeight[(a.status || '').toLowerCase()] || 0;
        const wB = statusWeight[(b.status || '').toLowerCase()] || 0;
        return wB - wA;
      });
    }

    return data;
  }, [filteredComplaints, selectedSort]);

  const toggleExpand = id => {
    setExpandedTicketId(prev => (prev === id ? null : id));
  };

  const getPriorityColor = p => {
    const priority = (p || '').toLowerCase();
    if (priority === 'high') return { bg: '#FEE2E2', text: '#EF4444' };
    if (priority === 'medium') return { bg: '#FEF3C7', text: '#F59E0B' };
    return { bg: '#E0F2FE', text: '#0284C7' };
  };

  const getStatusColor = s => {
    const status = (s || '').toLowerCase();
    if (status === 'pending')
      return { bg: '#FEF3C7', text: '#D97706', icon: 'hourglass-outline' };
    if (status === 'in progress' || status === 'in-progress')
      return { bg: '#E0F2FE', text: '#0284C7', icon: 'sync-outline' };
    if (status === 'resolved')
      return {
        bg: '#D1FAE5',
        text: '#059669',
        icon: 'checkmark-circle-outline',
      };
    return { bg: '#F3F4F6', text: '#6B7280', icon: 'help-circle-outline' };
  };

  const s = getStyles(theme, insets);

  const renderHeader = () => (
    <View>
      {/* Top summary metric cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.statsContainer}
      >
        {/* Total */}
        <View style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
          <View style={s.statHeader}>
            <Text style={s.statValue}>{stats.total}</Text>
            <View
              style={[
                s.statIconBox,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon
                name="list-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
          </View>
          <Text style={s.statLabel}>Total Complaints</Text>
        </View>

        {/* Pending */}
        <View style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
          <View style={s.statHeader}>
            <Text style={s.statValue}>{stats.pending}</Text>
            <View style={[s.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="hourglass-outline" size={20} color="#D97706" />
            </View>
          </View>
          <Text style={s.statLabel}>Pending</Text>
        </View>

        {/* In Progress */}
        <View style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
          <View style={s.statHeader}>
            <Text style={s.statValue}>{stats.inProgress}</Text>
            <View style={[s.statIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="sync-outline" size={20} color="#0284C7" />
            </View>
          </View>
          <Text style={s.statLabel}>In Progress</Text>
        </View>

        {/* Resolved */}
        <View style={[s.statCard, { backgroundColor: theme.colors.surface }]}>
          <View style={s.statHeader}>
            <Text style={s.statValue}>{stats.resolved}</Text>
            <View style={[s.statIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="checkmark-circle-outline" size={20} color="#059669" />
            </View>
          </View>
          <Text style={s.statLabel}>Resolved</Text>
        </View>
      </ScrollView>

      {/* Search Input Bar */}
      <View
        style={[
          s.searchBarContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Icon
          name="search-outline"
          size={20}
          color={theme.colors.textSecondary}
          style={s.searchIcon}
        />
        <TextInput
          style={[s.searchInput, { color: theme.colors.text }]}
          placeholder="Search by Ticket ID, Customer, Lineman, Status..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={s.clearBtn}
          >
            <Icon
              name="close-circle"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter/Sorting Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.sortChipsContainer}
      >
        <TouchableOpacity
          style={[
            s.sortChip,
            selectedSort === 'default' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedSort('default')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              s.sortChipText,
              { color: theme.colors.textSecondary },
              selectedSort === 'default' && { color: '#FFFFFF' },
            ]}
          >
            Default
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.sortChip,
            selectedSort === 'priority-hl' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedSort('priority-hl')}
          activeOpacity={0.7}
        >
          <Icon
            name="arrow-down-outline"
            size={14}
            color={
              selectedSort === 'priority-hl'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
            style={s.chipIcon}
          />
          <Text
            style={[
              s.sortChipText,
              { color: theme.colors.textSecondary },
              selectedSort === 'priority-hl' && { color: '#FFFFFF' },
            ]}
          >
            Priority (High to Low)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.sortChip,
            selectedSort === 'priority-lh' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedSort('priority-lh')}
          activeOpacity={0.7}
        >
          <Icon
            name="arrow-up-outline"
            size={14}
            color={
              selectedSort === 'priority-lh'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
            style={s.chipIcon}
          />
          <Text
            style={[
              s.sortChipText,
              { color: theme.colors.textSecondary },
              selectedSort === 'priority-lh' && { color: '#FFFFFF' },
            ]}
          >
            Priority (Low to High)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.sortChip,
            selectedSort === 'status' && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedSort('status')}
          activeOpacity={0.7}
        >
          <Icon
            name="filter-outline"
            size={14}
            color={
              selectedSort === 'status' ? '#FFFFFF' : theme.colors.textSecondary
            }
            style={s.chipIcon}
          />
          <Text
            style={[
              s.sortChipText,
              { color: theme.colors.textSecondary },
              selectedSort === 'status' && { color: '#FFFFFF' },
            ]}
          >
            Status
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Record Counter */}
      <View style={s.counterRow}>
        <Icon
          name="receipt-outline"
          size={16}
          color={theme.colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text style={[s.counterText, { color: theme.colors.text }]}>
          Service Requests{' '}
          <Text style={{ color: theme.colors.textSecondary }}>
            ({sortedComplaints.length} Records)
          </Text>
        </Text>
      </View>
    </View>
  );

  const renderComplaintCard = ({ item }) => {
    const isExpanded = expandedTicketId === item.id;
    const priorityColor = getPriorityColor(item.priority);
    const statusColor = getStatusColor(item.status);

    return (
      <View
        style={[
          s.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Ticket Header */}
        <View style={s.cardHeader}>
          <View style={s.ticketIdBox}>
            <Icon
              name="key-outline"
              size={14}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={s.ticketIdText}>{item.ticket_id}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Icon
              name={statusColor.icon}
              size={12}
              color={statusColor.text}
              style={{ marginRight: 4 }}
            />
            <Text style={[s.statusText, { color: statusColor.text }]}>
              {item.status || 'Pending'}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={s.cardBody}>
          {/* Customer */}
          <View style={s.detailRow}>
            <Icon
              name="person-outline"
              size={16}
              color={theme.colors.textSecondary}
              style={s.detailIcon}
            />
            <View style={s.detailTexts}>
              <Text
                style={[s.detailLabel, { color: theme.colors.textSecondary }]}
              >
                Customer
              </Text>
              <Text style={[s.detailValue, { color: theme.colors.text }]}>
                {item.customer_name}{' '}
                <Text style={s.customerIdText}>({item.customer_id})</Text>
              </Text>
            </View>
          </View>

          {/* Package Type */}
          <View style={s.detailRow}>
            <Icon
              name="pricetag-outline"
              size={16}
              color={theme.colors.textSecondary}
              style={s.detailIcon}
            />
            <View style={s.detailTexts}>
              <Text
                style={[s.detailLabel, { color: theme.colors.textSecondary }]}
              >
                Package
              </Text>
              <Text style={[s.detailValue, { color: theme.colors.text }]}>
                {item.package_type}
              </Text>
            </View>
          </View>

          {/* Service Type */}
          <View style={s.detailRow}>
            <Icon
              name="flash-outline"
              size={16}
              color={theme.colors.textSecondary}
              style={s.detailIcon}
            />
            <View style={s.detailTexts}>
              <Text
                style={[s.detailLabel, { color: theme.colors.textSecondary }]}
              >
                Service Type
              </Text>
              <Text style={[s.detailValue, { color: theme.colors.text }]}>
                {item.service_type || 'Internet'}
              </Text>
            </View>
          </View>

          {/* Expanded details */}
          {isExpanded && (
            <>
              {/* Lineman */}
              <View style={s.detailRow}>
                <Icon
                  name="build-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                  style={s.detailIcon}
                />
                <View style={s.detailTexts}>
                  <Text
                    style={[
                      s.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Assigned Lineman
                  </Text>
                  <Text style={[s.detailValue, { color: theme.colors.text }]}>
                    {item.lineman_name || 'Unassigned'}
                  </Text>
                </View>
              </View>

              {/* Address */}
              <View style={s.detailRow}>
                <Icon
                  name="location-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                  style={s.detailIcon}
                />
                <View style={s.detailTexts}>
                  <Text
                    style={[
                      s.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Address
                  </Text>
                  <Text style={[s.detailValue, { color: theme.colors.text }]}>
                    {item.address || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Created Date */}
              <View style={s.detailRow}>
                <Icon
                  name="time-outline"
                  size={16}
                  color={theme.colors.textSecondary}
                  style={s.detailIcon}
                />
                <View style={s.detailTexts}>
                  <Text
                    style={[
                      s.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Submitted Date
                  </Text>
                  <Text style={[s.detailValue, { color: theme.colors.text }]}>
                    {item.created_date || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Issue Description */}
              <View style={s.descriptionSection}>
                <Text
                  style={[
                    s.descriptionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Issue Description
                </Text>
                <View
                  style={[
                    s.descriptionBox,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[s.descriptionValue, { color: theme.colors.text }]}
                  >
                    {item.issue_description || 'No description provided.'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Card Footer */}
        <View style={[s.cardFooter, { borderTopColor: theme.colors.border }]}>
          <View
            style={[s.priorityBadge, { backgroundColor: priorityColor.bg }]}
          >
            <Text style={[s.priorityText, { color: priorityColor.text }]}>
              {item.priority || 'Low'} Priority
            </Text>
          </View>

          <View style={s.actionRow}>
            {/* Edit Button */}
            <TouchableOpacity
              style={[s.actionBtn, s.editBtn, { borderColor: '#EAB308' }]}
              onPress={() =>
                navigation.navigate('Customers', { complaint: item })
              }
              activeOpacity={0.7}
            >
              <Icon name="create-outline" size={14} color="#D97706" />
              <Text style={[s.actionBtnText, { color: '#D97706' }]}>Edit</Text>
            </TouchableOpacity>

            {/* View Details Button */}
            <TouchableOpacity
              style={[
                s.actionBtn,
                s.expandBtn,
                { borderColor: theme.colors.primary },
              ]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.actionBtnText, { color: theme.colors.primary }]}>
                {isExpanded ? 'Less' : 'Details'}
              </Text>
              <Icon
                name={
                  isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'
                }
                size={14}
                color={theme.colors.primary}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Main Content Area */}
      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[s.loadingText, { color: theme.colors.textSecondary }]}>
            Loading complaints...
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedComplaints}
          renderItem={renderComplaintCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Icon
                name="chatbox-ellipses-outline"
                size={60}
                color={theme.colors.textSecondary}
                style={{ marginBottom: 12 }}
              />
              <Text style={[s.emptyTitle, { color: theme.colors.text }]}>
                No Complaints Found
              </Text>
              <Text
                style={[s.emptySubtitle, { color: theme.colors.textSecondary }]}
              >
                {searchQuery
                  ? 'Try adjusting your search filters'
                  : 'There are no active complaint records at this time.'}
              </Text>
              <TouchableOpacity
                style={[s.retryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={refetch}
              >
                <Text style={s.retryBtnText}>Reload Data</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const getStyles = (theme, insets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 15,
      paddingBottom: 16,
      ...theme.shadows.md,
    },
    backBtn: {
      padding: 4,
    },
    headerBtn: {
      padding: 4,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '600',
    },
    // Stats Summary Grid
    statsContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      paddingBottom: 4,
    },
    statCard: {
      width: 140,
      borderRadius: 14,
      padding: 14,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.text,
    },
    statIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    // Search Bar
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      height: 48,
      paddingHorizontal: 14,
      marginBottom: 14,
      ...theme.shadows.sm,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
    },
    clearBtn: {
      padding: 4,
    },
    // Filter Chips
    sortChipsContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      paddingBottom: 2,
    },
    sortChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginRight: 8,
      backgroundColor: theme.colors.surface,
    },
    chipIcon: {
      marginRight: 4,
    },
    sortChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // Counter Row
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingLeft: 4,
    },
    counterText: {
      fontSize: 14,
      fontWeight: '700',
    },
    // Card Styles
    card: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 14,
      padding: 16,
      ...theme.shadows.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      paddingBottom: 10,
      marginBottom: 12,
    },
    ticketIdBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    ticketIdText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
    },
    cardBody: {
      marginBottom: 4,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    detailIcon: {
      marginRight: 10,
      width: 16,
      textAlign: 'center',
    },
    detailTexts: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    customerIdText: {
      fontWeight: '400',
      fontSize: 12,
    },
    descriptionSection: {
      marginTop: 10,
      marginBottom: 4,
    },
    descriptionLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 6,
    },
    descriptionBox: {
      borderRadius: 10,
      borderWidth: 1,
      padding: 10,
    },
    descriptionValue: {
      fontSize: 13,
      lineHeight: 18,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 12,
      marginTop: 4,
    },
    priorityBadge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    priorityText: {
      fontSize: 11,
      fontWeight: '800',
    },
    expandBtn: {
      backgroundColor: 'transparent',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: 'transparent',
    },
    editBtn: {
      marginRight: 6,
    },
    actionBtnText: {
      fontSize: 11,
      fontWeight: '700',
      marginLeft: 2,
    },
    // Empty state
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default ComplaintsInquiryScreen;
