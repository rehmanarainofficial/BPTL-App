import React, { useState } from 'react';
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
import { PersonDropdown } from '@components/common';
import { usePostComplaintMutation } from '@api/complaintApi';
import Toast from 'react-native-toast-message';

const PACKAGE_OPTIONS = [
  { label: 'Fiber Blast 50 Mbps', value: 'Fiber Blast 50 Mbps' },
  { label: 'Fiber Blast 100 Mbps', value: 'Fiber Blast 100 Mbps' },
  { label: 'Fiber Blast 200 Mbps', value: 'Fiber Blast 200 Mbps' },
  { label: 'Fiber Blast 300 Mbps', value: 'Fiber Blast 300 Mbps' },
  { label: 'Fiber Blast 500 Mbps', value: 'Fiber Blast 500 Mbps' },
];

const SERVICE_TYPE_OPTIONS = [
  { label: 'Service Issue', value: '' },
  { label: 'Cable TV', value: 'Cable TV' },
  { label: 'No Internet / Red Light', value: 'No Internet / Red Light' },
  { label: 'Slow Speed Issue', value: 'Slow Speed Issue' },
  { label: 'Frequent Disconnection', value: 'Frequent Disconnection' },
  { label: 'Physical Cable Damage', value: 'Physical Cable Damage' },
  {
    label: 'Routing / Gaming Ping Issue',
    value: 'Routing / Gaming Ping Issue',
  },
  { label: 'Other Technical Issue', value: 'Other Technical Issue' },
];

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
];

const LINEMAN_OPTIONS = [
  { label: 'Lineman', value: '' },
  { label: 'Sunil Yadav', value: 'Sunil Yadav' },
  { label: 'Zeeshan Khan', value: 'Zeeshan Khan' },
  { label: 'Imran Ali', value: 'Imran Ali' },
  { label: 'Sajid Ahmed', value: 'Sajid Ahmed' },
  { label: 'Kamran Shah', value: 'Kamran Shah' },
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
  const [describeIssue, setDescribeIssue] = useState(
    complaint?.issue_description || '',
  );

  React.useEffect(() => {
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
      setDescribeIssue('');
    }
  }, [complaint, isEditing, navigation]);

  const [postComplaint, { isLoading: isPostLoading }] =
    usePostComplaintMutation();

  const handleCustomerSelect = customer => {
    if (customer) {
      setSelectedCustomerId(customer.id);
      setFullName(customer.name || '');

      const cleanName = (customer.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      setEmail(cleanName ? `${cleanName}@example.com` : 'customer@example.com');
      setAddress('Latifabad Hyderabad');
    }
  };

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
        {/* Title Area mimicking user screenshot */}
        <View style={s.titleArea}>
          <View style={s.titleRow}>
            <Icon
              name="create-outline"
              size={24}
              color={theme.colors.primary}
              style={s.titleIcon}
            />
            <Text style={s.formTitle}>
              {isEditing ? 'Edit Complaint' : 'Register Complaint'}
            </Text>
          </View>
          <Text style={s.formSubtitle}>
            {isEditing
              ? 'Update the details of the complaint below.'
              : 'Start typing customer name or ID - suggestions will appear.'}
          </Text>
        </View>

        {/* Customer Field Section using the existing PersonDropdown */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Icon
              name="search-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
            <Text style={s.fieldLabel}>Customer</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <PersonDropdown
            type="customer"
            selectedPersonId={selectedCustomerId}
            onSelect={handleCustomerSelect}
            style={s.dropdownOverride}
          />
        </View>

        {/* Full Name */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Icon
              name="person-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
            <Text style={s.fieldLabel}>Full Name</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <View style={[s.inputWrap, s.disabledInputWrap]}>
            <TextInput
              style={s.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name will appear here"
              placeholderTextColor={theme.colors.textSecondary}
              editable={false}
            />
          </View>
        </View>

        {/* Email Address */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Icon
              name="mail-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
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
            <Icon
              name="location-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
            <Text style={s.fieldLabel}>Address</Text>
            <Text style={s.requiredAsterisk}> *</Text>
          </View>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Latifabad Hyderabad"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Package Type */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Icon
              name="pricetag-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
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
              <Icon
                name="flash-outline"
                size={14}
                color={theme.colors.primary}
                style={s.fieldLabelIcon}
              />
              <Text style={s.fieldLabel}>Service Type</Text>
              <Text style={s.requiredAsterisk}> *</Text>
            </View>
            <Dropdown
              style={s.formDropdown}
              data={SERVICE_TYPE_OPTIONS}
              labelField="label"
              valueField="value"
              value={serviceType}
              onChange={item => setServiceType(item.value)}
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
              <Icon
                name="alert-circle-outline"
                size={14}
                color={theme.colors.primary}
                style={s.fieldLabelIcon}
              />
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
            <Icon
              name="build-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
            <Text style={s.fieldLabel}>Assign Lineman</Text>
          </View>
          <Dropdown
            style={s.formDropdown}
            data={LINEMAN_OPTIONS}
            labelField="label"
            valueField="value"
            value={lineman}
            onChange={item => setLineman(item.value)}
            placeholder="Lineman"
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

        {/* Describe Issue */}
        <View style={s.fieldSection}>
          <View style={s.labelRow}>
            <Icon
              name="chatbubble-ellipses-outline"
              size={14}
              color={theme.colors.primary}
              style={s.fieldLabelIcon}
            />
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
    },
    formSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
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
    fieldLabelIcon: {
      marginRight: 6,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    requiredAsterisk: {
      color: '#EF4444',
      fontWeight: '700',
    },
    dropdownOverride: {
      paddingHorizontal: 0,
      paddingTop: 0,
      marginBottom: 0,
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
    disabledInputWrap: {
      backgroundColor: theme.colors.background,
      opacity: 0.8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
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
    dropdownPlaceholder: {
      fontSize: 14,
    },
    dropdownSelectedText: {
      fontSize: 14,
    },
    dropdownItemText: {
      fontSize: 14,
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
    },
  });

export default CustomersScreen;
