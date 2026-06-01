import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { useTheme } from '@config/useTheme';
import {
  usePostComplaintMutation,
  useGetLinemenQuery,
  useGetEmployeesQuery,
} from '@api/complaintApi';
import Toast from 'react-native-toast-message';

const PACKAGE_OPTIONS = [
  { label: 'Fiber Blast 300 Mbps', value: 'Fiber Blast 300 Mbps' },
  { label: 'Fiber Pro 1 Gbps', value: 'Fiber Pro 1 Gbps' },
  { label: 'Cable Max HD', value: 'Cable Max HD' },
  { label: 'Cable Essential', value: 'Cable Essential' },
  { label: 'Duo Entertainment Pack', value: 'Duo Entertainment Pack' },
  { label: 'Business Connect', value: 'Business Connect' },
];

const SERVICE_TYPE_OPTIONS = [
  { label: 'No Internet', value: 'No Internet' },
  { label: 'Slow Speed', value: 'Slow Speed' },
  { label: 'Intermittent Connection', value: 'Intermittent Connection' },
  { label: 'Router Issue', value: 'Router Issue' },
  { label: 'Cable Damage', value: 'Cable Damage' },
  { label: 'Billing Issue', value: 'Billing Issue' },
  { label: 'New Connection', value: 'New Connection' },
  { label: 'Other', value: 'Other' },
];

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
  { label: 'Critical', value: 'Critical' },
];

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'On Hold', value: 'On Hold' },
];

const CustomersScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { complaint } = route.params || {};
  const isEditing = !!complaint;

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    complaint?.customer_id || null,
  );
  const [fullName, setFullName] = useState(complaint?.customer_name || '');
  const [email, setEmail] = useState(complaint?.customer_email || '');
  const [address, setAddress] = useState(complaint?.address || '');
  const [packageType, setPackageType] = useState(
    complaint?.package_type || 'Fiber Blast 300 Mbps',
  );
  const [serviceType, setServiceType] = useState(complaint?.service_type || '');
  const [priority, setPriority] = useState(complaint?.priority || 'High');
  const [lineman, setLineman] = useState(complaint?.lineman_name || '');
  const [status, setStatus] = useState(complaint?.status || 'Pending');
  const [describeIssue, setDescribeIssue] = useState(
    complaint?.issue_description || '',
  );

  useEffect(() => {
    console.log(
      'CustomersScreen [DEBUG] - Route params received (complaint):',
      complaint,
    );
    if (isEditing) {
      navigation.setOptions({ title: 'Edit Complaint' });
    } else {
      navigation.setOptions({ title: 'Register Complaint' });
    }

    if (complaint) {
      console.log(
        'CustomersScreen [DEBUG] - Populating Form State for EDIT:',
        complaint,
      );
      setSelectedCustomerId(complaint.customer_id || null);
      setFullName(complaint.customer_name || '');
      setEmail(complaint.customer_email || '');
      setAddress(complaint.address || '');
      setPackageType(complaint.package_type || 'Fiber Blast 300 Mbps');
      setServiceType(complaint.service_type || '');
      setPriority(complaint.priority || 'High');
      setLineman(complaint.lineman_name || '');
      setStatus(complaint.status || 'Pending');
      setDescribeIssue(complaint.issue_description || '');
    } else {
      console.log(
        'CustomersScreen [DEBUG] - Resetting Form State for INSERT (Create)',
      );
      setSelectedCustomerId(null);
      setFullName('');
      setEmail('');
      setAddress('');
      setPackageType('Fiber Blast 300 Mbps');
      setServiceType('');
      setPriority('High');
      setLineman('');
      setStatus('Pending');
      setDescribeIssue('');
    }
  }, [complaint, isEditing, navigation]);

  const [postComplaint, { isLoading: isPostLoading }] =
    usePostComplaintMutation();

  // Fetch live lists
  const { data: employeesRes, isLoading: isEmployeesLoading } = useGetEmployeesQuery();
  const { data: linemenRes, isLoading: isLinemenLoading } = useGetLinemenQuery();

  // Memoize employee dropdown options
  const employeeOptions = useMemo(() => {
    let list = [];
    if (employeesRes?.data) {
      list = employeesRes.data.map(emp => ({
        label: emp.name,
        value: emp.debtor_no,
      }));
    }
    // Fallback in Edit Mode to ensure current selected customer displays correctly
    if (isEditing && complaint?.customer_id) {
      const exists = list.some(item => String(item.value) === String(complaint.customer_id));
      if (!exists) {
        list.unshift({
          label: complaint.customer_name || `Customer ID: ${complaint.customer_id}`,
          value: complaint.customer_id,
        });
      }
    }
    return list;
  }, [employeesRes, isEditing, complaint]);

  // Memoize lineman dropdown options
  const linemenOptions = useMemo(() => {
    let list = [];
    if (linemenRes?.data) {
      list = linemenRes.data.map(lm => ({
        label: lm.salesman_name,
        value: lm.salesman_name,
      }));
    }
    // Fallback in Edit Mode
    if (isEditing && complaint?.lineman_name) {
      const exists = list.some(item => item.value === complaint.lineman_name);
      if (!exists) {
        list.unshift({
          label: complaint.lineman_name,
          value: complaint.lineman_name,
        });
      }
    }
    return list;
  }, [linemenRes, isEditing, complaint]);

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a Customer first.',
      });
      return;
    }

    if (!serviceType) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a Service Type.',
      });
      return;
    }

    if (!describeIssue.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please describe the issue in detail.',
      });
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomerId,
        user_name: fullName,
        userEmail: email,
        address: address,
        packageType: packageType,
        serviceType: serviceType,
        priority: priority,
        lineman_name: lineman,
        issue_desc: describeIssue,
        status: status,
      };

      if (isEditing && complaint?.ticket_id) {
        payload.ticket_id = complaint.ticket_id;
      }
      const response = await postComplaint(payload).unwrap();

      if (response && response.status === true) {
        Toast.show({
          type: 'success',
          text1: isEditing ? 'Complaint Updated' : 'Complaint Registered',
          text2:
            response?.message ||
            `Complaint has been ${
              isEditing ? 'updated' : 'registered'
            } and assigned successfully.`,
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: isEditing ? 'Update Failed' : 'Registration Failed',
          text2:
            response?.message ||
            `Server rejected complaint ${
              isEditing ? 'update' : 'registration'
            }.`,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: 'Failed to submit complaint to the server.',
      });
    }
  };

  const s = getStyles(theme, insets);

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Field Section */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>Customer</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <Dropdown
            style={s.formDropdown}
            data={employeeOptions}
            search
            searchPlaceholder="Search customer..."
            labelField="label"
            valueField="value"
            value={selectedCustomerId}
            onChange={item => {
              setSelectedCustomerId(item.value);
              setFullName(item.label);
            }}
            placeholder={isEmployeesLoading ? "Loading Customers..." : "Select Customer"}
            placeholderStyle={[
              s.dropdownPlaceholder,
              { color: theme.colors.textSecondary },
            ]}
            selectedTextStyle={[
              s.dropdownSelectedText,
              { color: theme.colors.text },
            ]}
            itemTextStyle={[s.dropdownItemText, { color: theme.colors.text }]}
            containerStyle={[
              s.dropdownContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>

        {/* Email Address */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>Email Address</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="customer@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Address */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>Address</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Address..."
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Package Type */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>Package Type</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <Dropdown
            style={s.formDropdown}
            data={PACKAGE_OPTIONS}
            labelField="label"
            valueField="value"
            value={packageType}
            onChange={item => setPackageType(item.value)}
            placeholderStyle={[
              s.dropdownPlaceholder,
              { color: theme.colors.textSecondary },
            ]}
            selectedTextStyle={[
              s.dropdownSelectedText,
              { color: theme.colors.text },
            ]}
            itemTextStyle={[s.dropdownItemText, { color: theme.colors.text }]}
            containerStyle={[
              s.dropdownContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>

        {/* Service Type & Priority Row */}
        <View style={s.rowFields}>
          <View style={[s.fieldSection, s.halfField]}>
            <View style={s.labelRow}>
              <Text style={s.fieldLabel}>Service Type</Text>
              <Text style={s.requiredAsterisk}> *</Text>
            </View>
            <Dropdown
              style={[s.formDropdown, isEditing && s.disabledDropdown]}
              data={SERVICE_TYPE_OPTIONS}
              labelField="label"
              valueField="value"
              value={serviceType}
              onChange={item => setServiceType(item.value)}
              disable={isEditing}
              placeholder="Service Issue"
              placeholderStyle={[
                s.dropdownPlaceholder,
                { color: theme.colors.textSecondary },
              ]}
              selectedTextStyle={[
                s.dropdownSelectedText,
                { color: theme.colors.text },
              ]}
              itemTextStyle={[s.dropdownItemText, { color: theme.colors.text }]}
              containerStyle={[
                s.dropdownContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>

          <View style={[s.fieldSection, s.halfField]}>
            <View style={s.labelRow}>
              <Text style={s.fieldLabel}>Priority</Text>
              <Text style={s.requiredAsterisk}> *</Text>
            </View>
            <Dropdown
              style={s.formDropdown}
              data={PRIORITY_OPTIONS}
              labelField="label"
              valueField="value"
              value={priority}
              onChange={item => setPriority(item.value)}
              placeholder="Select Priority"
              placeholderStyle={[
                s.dropdownPlaceholder,
                { color: theme.colors.textSecondary },
              ]}
              selectedTextStyle={[
                s.dropdownSelectedText,
                { color: theme.colors.text },
              ]}
              itemTextStyle={[s.dropdownItemText, { color: theme.colors.text }]}
              containerStyle={[
                s.dropdownContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
        </View>

        {/* Assign Lineman */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>Assign Lineman</Text>
          </View>
          <Dropdown
            style={s.formDropdown}
            data={linemenOptions}
            labelField="label"
            valueField="value"
            value={lineman}
            onChange={item => setLineman(item.value)}
            placeholder={isLinemenLoading ? "Loading Linemen..." : "Select Lineman"}
            placeholderStyle={[
              s.dropdownPlaceholder,
              { color: theme.colors.textSecondary },
            ]}
            selectedTextStyle={[
              s.dropdownSelectedText,
              { color: theme.colors.text },
            ]}
            itemTextStyle={[s.dropdownItemText, { color: theme.colors.text }]}
            containerStyle={[
              s.dropdownContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          />
        </View>

        {/* Status Dropdown (Only in Edit Mode) */}
        {isEditing && (
          <View style={s.fieldSection}>
            <View style={s.labelRow}>
              <Text style={s.fieldLabel}>Status</Text>
              <Text style={s.requiredAsterisk}> *</Text>
            </View>
            <Dropdown
              style={s.formDropdown}
              data={STATUS_OPTIONS}
              labelField="label"
              valueField="value"
              value={status}
              onChange={item => setStatus(item.value)}
              placeholder="Select Status"
              placeholderStyle={[
                s.dropdownPlaceholder,
                { color: theme.colors.textSecondary },
              ]}
              selectedTextStyle={[
                s.dropdownSelectedText,
                { color: theme.colors.text },
              ]}
              itemTextStyle={[s.dropdownItemText, { color: theme.colors.text }]}
              containerStyle={[
                s.dropdownContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            />
          </View>
        )}

        {/* Describe Issue */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>Describe Issue</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <View style={[s.inputWrap, s.textAreaWrap]}>
            <TextInput
              style={[s.input, s.textArea]}
              value={describeIssue}
              onChangeText={setDescribeIssue}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
          disabled={isPostLoading}
          activeOpacity={0.8}
        >
          {isPostLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={s.submitContent}>
              <Icon
                name="paper-plane-outline"
                size={20}
                color="#FFFFFF"
                style={s.submitIcon}
              />
              <Text style={s.submitBtnText}>
                {isEditing ? 'Update Complaint' : 'Submit Complaint'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'Outfit-Bold',
    },
    placeholderHeaderBtn: {
      width: 36,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    titleArea: {
      marginBottom: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    titleIcon: {
      marginRight: 8,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.text,
      fontFamily: 'Outfit-Bold',
    },
    formSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
      fontFamily: 'Outfit-Regular',
    },
    fieldSection: {
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingLeft: 4,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: 'Outfit-Bold',
    },
    requiredAsterisk: {
      color: '#EF4444',
      fontWeight: '700',
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      height: 48,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: 'Outfit-Regular',
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    formDropdown: {
      borderRadius: 12,
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      height: 48,
      backgroundColor: theme.colors.surface,
    },
    disabledDropdown: {
      backgroundColor: theme.colors.border,
      opacity: 0.7,
    },
    dropdownPlaceholder: {
      fontSize: 14,
      fontFamily: 'Outfit-Regular',
    },
    dropdownSelectedText: {
      fontSize: 14,
      fontFamily: 'Outfit-Regular',
    },
    dropdownItemText: {
      fontSize: 14,
      fontFamily: 'Outfit-Regular',
    },
    dropdownContainer: {
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 4,
      overflow: 'hidden',
    },
    rowFields: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfField: {
      width: '48.5%',
    },
    textAreaWrap: {
      height: 100,
      alignItems: 'flex-start',
      paddingVertical: 8,
    },
    textArea: {
      height: '100%',
      textAlignVertical: 'top',
    },
    submitBtn: {
      height: 52,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      ...theme.shadows.md,
    },
    submitContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    submitIcon: {
      marginRight: 8,
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Outfit-Bold',
    },
  });

export default CustomersScreen;
