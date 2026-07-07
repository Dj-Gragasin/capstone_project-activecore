import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonFooter,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonButtons,
  IonMenuButton,
  useIonToast,
  IonSearchbar,
  IonBadge,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import {
  add,
  person,
  create,
  trash,
  close,
  checkmark,
  calendar,
  card,
  call,
  fitness,
} from 'ionicons/icons';
import './MembersManagement.css';

import { API_CONFIG } from '../config/api.config';

const API_URL = API_CONFIG.BASE_URL;
const MEMBERS_AUTO_REFRESH_MS = 90000;
const MEMBERS_SEARCH_DEBOUNCE_MS = 700;

type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled';
type MemberStatusFilter = 'all' | 'active' | 'inactive' | 'pending';

interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  membershipType: string;
  membershipPrice: number;
  emergencyContact?: string;
  address?: string;
  joinDate: string;
  status: string;
  paymentStatus?: PaymentStatus;
}

const MembersManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const searchDebounceTimer = useRef<any>(null);
  const [searchText, setSearchText] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<MemberStatusFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalMember, setOriginalMember] = useState<Member | null>(null);
  const [currentMember, setCurrentMember] = useState<Member>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '',
    membershipType: 'monthly',
    membershipPrice: 100,
    emergencyContact: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active',
    paymentStatus: 'pending',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);
  const [paymentData, setPaymentData] = useState({
    membershipType: 'monthly',
    membershipPrice: 100,
    paymentMethod: 'cash',
  });
  const todayDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Add this line
  const [presentToast] = useIonToast();

  const getBackendStatusParam = (filter: MemberStatusFilter): string =>
    filter === 'active' || filter === 'inactive' ? filter : '';

  const loadMembers = useCallback(async (opts?: { page?: number; perPage?: number; sortBy?: string; sortDir?: string; q?: string; status?: string }) => {
    setLoadingMembers(true);
    try {
      const p = opts?.page ?? page;
      const pp = opts?.perPage ?? perPage;
      const sb = opts?.sortBy ?? sortBy;
      const sd = opts?.sortDir ?? sortDir;
      const q = opts?.q ?? searchText;
      const status = opts?.status ?? getBackendStatusParam(memberStatusFilter);

      const params = new URLSearchParams();
      params.append('page', String(p));
      params.append('perPage', String(pp));
      params.append('sortBy', String(sb));
      params.append('sortDir', String(sd));
      if (q && String(q).trim()) params.append('q', String(q).trim());
      if (status) params.append('status', status);

      const res = await fetch(`${API_URL}/members?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const json = await res.json();

        // Support both payload styles:
        // 1) array response: [member, member, ...]
        // 2) paginated object: { data: [...], total, page, perPage }
        const memberList = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];

        const total = Array.isArray(json)
          ? memberList.length
          : Number(json?.total ?? memberList.length);

        setMembers(memberList);
        setTotalMembers(total);
        setPage(Array.isArray(json) ? p : Number(json?.page || p));
        setPerPage(Array.isArray(json) ? pp : Number(json?.perPage || pp));
      } else {
        const err = await res.json().catch(() => ({}));
        presentToast({ message: err.message || 'Failed to load members', duration: 2000, color: 'danger' });
      }
    } catch (error) {
      console.error('Load members error:', error);
      presentToast({ message: 'Failed to load members', duration: 2000, color: 'danger' });
    } finally {
      setLoadingMembers(false);
    }
  }, [page, perPage, sortBy, sortDir, searchText, memberStatusFilter, presentToast]);

  // Load members when relevant params change
  useEffect(() => {
    const backendStatus = getBackendStatusParam(memberStatusFilter);
    loadMembers({ page, perPage, sortBy, sortDir, q: searchText, status: backendStatus });
    const intervalId = window.setInterval(() => {
      loadMembers({ page, perPage, sortBy, sortDir, q: searchText, status: backendStatus });
    }, MEMBERS_AUTO_REFRESH_MS);

    const handleRefreshMembers = () => {
      loadMembers({ page, perPage, sortBy, sortDir, q: searchText, status: backendStatus });
    };

    window.addEventListener('focus', handleRefreshMembers);
    window.addEventListener('payments:updated', handleRefreshMembers as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleRefreshMembers);
      window.removeEventListener('payments:updated', handleRefreshMembers as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDir, memberStatusFilter]);

  // Debounced search
  useEffect(() => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(() => {
      setPage(1);
      loadMembers({ page: 1, perPage, sortBy, sortDir, q: searchText, status: getBackendStatusParam(memberStatusFilter) });
    }, MEMBERS_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(searchDebounceTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const normalizedSearchText = useMemo(() => searchText.trim().toLowerCase(), [searchText]);

  const searchedMembers = useMemo(() => {
    if (!normalizedSearchText) return members;

    return members.filter((member) => {
      const searchable = [
        member.firstName,
        member.lastName,
        member.email,
        member.phone,
        member.membershipType,
        member.status,
        member.paymentStatus,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ');

      return searchable.includes(normalizedSearchText);
    });
  }, [members, normalizedSearchText]);

  const memberStats = useMemo(() => {
    const activeCount = searchedMembers.filter((m) => String(m.status || '').toLowerCase() === 'active').length;
    const inactiveCount = searchedMembers.filter((m) => String(m.status || '').toLowerCase() !== 'active').length;
    const pendingCount = searchedMembers.filter((m) => String(m.paymentStatus || 'pending').toLowerCase() === 'pending').length;

    return {
      total: searchedMembers.length,
      active: activeCount,
      inactive: inactiveCount,
      pending: pendingCount,
    };
  }, [searchedMembers]);

  const filteredMembers = useMemo(() => {
    if (memberStatusFilter === 'active') {
      return searchedMembers.filter((m) => String(m.status || '').toLowerCase() === 'active');
    }

    if (memberStatusFilter === 'inactive') {
      return searchedMembers.filter((m) => String(m.status || '').toLowerCase() !== 'active');
    }

    if (memberStatusFilter === 'pending') {
      return searchedMembers.filter((m) => String(m.paymentStatus || 'pending').toLowerCase() === 'pending');
    }

    return searchedMembers;
  }, [searchedMembers, memberStatusFilter]);

  const totalFilteredMembers = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredMembers / perPage));
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredMembers.slice(start, start + perPage);
  }, [filteredMembers, page, perPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleAddMember = () => {
    setIsEditing(false);
    setOriginalMember(null);
    setCurrentMember({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      gender: 'male',
      dateOfBirth: '',
      membershipType: 'monthly',
      membershipPrice: 100,
      emergencyContact: '',
      address: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      paymentStatus: 'pending',
    });
    setShowModal(true);
  };

  const handleEditMember = (member: Member) => {
    setIsEditing(true);
    setOriginalMember({ ...member });
    // Password should be optional on edit
    setCurrentMember({ ...member, password: '' });
    setShowModal(true);
  };

  const normalizeText = (value: any): string => String(value ?? '').trim();

  const normalizePHMobile = (value: any): string | null => {
    const digits = String(value ?? '').replace(/\D/g, '');

    if (/^09\d{9}$/.test(digits)) return digits;

    return null;
  };

  const addIfChanged = (payload: any, key: keyof Member, value: any, original: any) => {
    if (typeof value === 'string') {
      const v = normalizeText(value);
      const o = normalizeText(original);
      if (v !== '' && v !== o) payload[key] = v;
      return;
    }
    if (typeof value === 'number') {
      const v = Number(value);
      const o = Number(original);
      if (Number.isFinite(v) && v !== o) payload[key] = v;
      return;
    }
    if (value !== undefined && value !== original) payload[key] = value;
  };

  const handleSaveMember = async () => {
    if (!isEditing) {
      if (
        !normalizeText(currentMember.firstName) ||
        !normalizeText(currentMember.lastName) ||
        !normalizeText(currentMember.email) ||
        !normalizeText(currentMember.phone)
      ) {
        presentToast({ message: 'Fill all required fields', duration: 2000, color: 'warning' });
        return;
      }

      const normalizedPhone = normalizePHMobile(currentMember.phone);
      if (!normalizedPhone) {
        presentToast({
          message: 'Invalid mobile number. Enter exactly 11 digits (09XXXXXXXXX).',
          duration: 2600,
          color: 'warning',
        });
        return;
      }

      if (!normalizeText(currentMember.password)) {
        presentToast({ message: 'Password is required', duration: 2000, color: 'warning' });
        return;
      }
    } else {
      if (!currentMember.id) {
        presentToast({ message: 'Missing member id', duration: 2000, color: 'danger' });
        return;
      }
      if (!originalMember) {
        presentToast({ message: 'Missing original member data', duration: 2000, color: 'danger' });
        return;
      }
    }

    const original = isEditing ? (originalMember as Member) : null;

    const payload: any = {};

    if (!isEditing) {
      const normalizedPhone = normalizePHMobile(currentMember.phone) as string;
      payload.firstName = normalizeText(currentMember.firstName);
      payload.lastName = normalizeText(currentMember.lastName);
      payload.username = normalizeText(currentMember.email);
      payload.email = payload.username;
      payload.phone = normalizedPhone;
      payload.gender = currentMember.gender;
      payload.dateOfBirth = currentMember.dateOfBirth;
      payload.membershipType = currentMember.membershipType;
      payload.membershipPrice = currentMember.membershipPrice;
      payload.emergencyContact = currentMember.emergencyContact;
      payload.address = currentMember.address;
      payload.joinDate = currentMember.joinDate;
      payload.status = currentMember.status;
      payload.password = normalizeText(currentMember.password);
    } else {
      // Partial update: only send changed fields; blank strings won't overwrite
      addIfChanged(payload, 'firstName', currentMember.firstName, original!.firstName);
      addIfChanged(payload, 'lastName', currentMember.lastName, original!.lastName);
      addIfChanged(payload, 'email', currentMember.email, original!.email);
      if (payload.email !== undefined) {
        payload.username = payload.email;
      }

      if (normalizeText(currentMember.phone)) {
        const normalizedCurrentPhone = normalizePHMobile(currentMember.phone);
        if (!normalizedCurrentPhone) {
          presentToast({
            message: 'Invalid mobile number. Enter exactly 11 digits (09XXXXXXXXX).',
            duration: 2600,
            color: 'warning',
          });
          return;
        }

        const normalizedOriginalPhone =
          normalizePHMobile(original!.phone) || normalizeText(original!.phone);

        if (normalizedCurrentPhone !== normalizedOriginalPhone) {
          payload.phone = normalizedCurrentPhone;
        }
      }

      // Selects: send if changed (these are never blank)
      if (currentMember.gender && currentMember.gender !== original!.gender) payload.gender = currentMember.gender;
      if (currentMember.status && currentMember.status !== original!.status) payload.status = currentMember.status;

      // Dates: send if changed AND not blank
      addIfChanged(payload, 'dateOfBirth', currentMember.dateOfBirth, original!.dateOfBirth);
      addIfChanged(payload, 'joinDate', currentMember.joinDate, original!.joinDate);

      // Membership: if type changes, also send price
      if (currentMember.membershipType && currentMember.membershipType !== original!.membershipType) {
        payload.membershipType = currentMember.membershipType;
        payload.membershipPrice = currentMember.membershipPrice;
      } else {
        // Allow price change alone if your UI ever supports it
        addIfChanged(payload, 'membershipPrice', currentMember.membershipPrice, original!.membershipPrice);
      }

      addIfChanged(payload, 'emergencyContact', currentMember.emergencyContact, original!.emergencyContact);
      addIfChanged(payload, 'address', currentMember.address, original!.address);

      const pw = normalizeText(currentMember.password);
      if (pw) payload.password = pw;

      if (Object.keys(payload).length === 0) {
        presentToast({ message: 'No changes to update', duration: 2000, color: 'warning' });
        return;
      }
    }

    const url = isEditing ? `${API_URL}/members/${currentMember.id}` : `${API_URL}/members`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      console.log('💾 Saving member:', payload);
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        presentToast({
          message: isEditing 
            ? 'Member updated successfully' 
            : '✅ Member added! Payment record created.',
          duration: 3000,
          color: 'success',
        });
        setShowModal(false);
        await loadMembers();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('payments:updated'));
      } else {
        const err = await res.json().catch(() => ({ message: 'Save failed' }));
        console.error('❌ Save error:', err);
        presentToast({
          message: err.message || 'Save failed',
          duration: 2500,
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('❌ Save exception:', error);
      presentToast({ 
        message: 'Network error - check if backend is running', 
        duration: 2500, 
        color: 'danger' 
      });
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      const res = await fetch(`${API_URL}/members/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        presentToast({
          message: 'Member deleted successfully',
          duration: 2000,
          color: 'success',
        });
        await loadMembers();
      } else {
        presentToast({
          message: 'Failed to delete member',
          duration: 2000,
          color: 'danger',
        });
      }
    } catch (error) {
      console.error('Delete member error:', error);
      presentToast({
        message: 'Failed to delete member',
        duration: 2000,
        color: 'danger',
      });
    }
  };

  const getMembershipPrice = (type: string): number => {
    switch (type) {
      case 'monthly':
        return 100;
      case 'quarterly':
        return 200;
      case 'annual':
        return 300;
      default:
        return 100;
    }
  };

  const handleMembershipTypeChange = (type: string) => {
    setCurrentMember({
      ...currentMember,
      membershipType: type,
      membershipPrice: getMembershipPrice(type),
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      default:
        // Any legacy/unknown status (e.g. 'suspended') should behave like inactive
        return 'warning';
    }
  };

  const getPaymentStatusColor = (status?: PaymentStatus): string => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'danger';
      case 'cancelled':
        return 'medium';
      default:
        return 'medium';
    }
  };

  const handleRecordPayment = (member: Member) => {
    setSelectedMemberForPayment(member);
    setPaymentData({
      membershipType: member.membershipType || 'monthly',
      membershipPrice: member.membershipPrice || 100,
      paymentMethod: 'cash',
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (!selectedMemberForPayment) return;

    try {
      setIsSubmitting(true);
      console.log('\n💰 ===== RECORDING PAYMENT IN MEMBERS MANAGEMENT =====');
      
      const paymentPayload = {
        userId: selectedMemberForPayment.id,
        membershipType: paymentData.membershipType,
        amount: paymentData.membershipPrice,
        paymentMethod: paymentData.paymentMethod,
      };

      console.log('📝 Payment payload:', paymentPayload);

      const response = await fetch(`${API_URL}/admin/payments/record-cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      console.log(`📡 Response status: ${response.status}`);

      const result = await response.json();
      console.log('📡 Response body:', result);

      if (response.ok && result.success) {
        console.log('✅ Payment recorded successfully!');
        console.log(`💰 Amount: ₱${paymentData.membershipPrice.toLocaleString()}`);
        console.log('🕒 Payment queued for admin approval');
        
        presentToast({
          message: `✅ Cash payment recorded and queued. Approve it in Pending Payments to activate the account.`,
          duration: 5000,
          color: 'success',
          position: 'top'
        });

        // Close modal first
        setShowPaymentModal(false);
        setSelectedMemberForPayment(null);
        
        // Reload members to show updated status
        console.log('🔄 Reloading members list...');
        await loadMembers();

        // ✅ Dispatch event to Admin Dashboard with more details
        console.log('🔔 Dispatching payments:updated event...');
        const event = new CustomEvent('payments:updated', {
          detail: {
            type: 'payment_recorded',
            memberId: selectedMemberForPayment.id,
            memberName: `${selectedMemberForPayment.firstName} ${selectedMemberForPayment.lastName}`,
            amount: paymentData.membershipPrice,
            method: paymentData.paymentMethod,
            transactionId: result.transactionId,
            paymentStatus: result.paymentStatus,
            timestamp: new Date().toISOString()
          },
        });
        
        window.dispatchEvent(event);
        console.log('✅ Event dispatched with details:', event.detail);
        console.log('===== PAYMENT RECORDING COMPLETE =====\n');

      } else {
        console.error('❌ Payment recording failed:', result);
        throw new Error(result.message || 'Failed to record payment');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      presentToast({
        message: `❌ Failed to record payment: ${error.message}`,
        duration: 4000,
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentMembershipTypeChange = (type: string) => {
    setPaymentData({
      ...paymentData,
      membershipType: type,
      membershipPrice: getMembershipPrice(type),
    });
  };

  const handleMemberFormKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (showModal) {
      handleSaveMember();
    }
  };

  const handlePaymentFormKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (showPaymentModal && !isSubmitting) {
      handleSavePayment();
    }
  };

  const emptyStateTitle =
    memberStatusFilter === 'active'
      ? 'No Active Members Found'
      : memberStatusFilter === 'inactive'
        ? 'No Inactive Members Found'
        : memberStatusFilter === 'pending'
          ? 'No Members With Pending Payments'
        : 'No Members Found';

  const emptyStateDescription =
    normalizedSearchText && filteredMembers.length === 0
      ? 'No members match your search.'
      : memberStatusFilter === 'active'
      ? 'There are currently no active members.'
      : memberStatusFilter === 'inactive'
        ? 'There are currently no inactive members.'
        : memberStatusFilter === 'pending'
          ? 'There are currently no members with pending payments.'
        : 'Add your first member to get started';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Members Management</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleAddMember} color="success" fill="solid" className="add-member-btn">
              <IonIcon icon={add} slot="start" />
              Add Member
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="members-content">
        <div className="members-container">
          <IonGrid fixed>
            {/* Header Stats */}
            <IonRow>
              <IonCol size="12" sizeSm="6" sizeMd="3">
                <div
                  className={`stat-card clickable ${memberStatusFilter === 'all' ? 'active-filter' : ''}`}
                  onClick={() => {
                    setMemberStatusFilter('all');
                    setPage(1);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMemberStatusFilter('all');
                      setPage(1);
                    }
                  }}
                >
                  <IonIcon icon={person} />
                  <h3>{memberStats.total}</h3>
                  <p>Total Members</p>
                </div>
              </IonCol>
              <IonCol size="12" sizeSm="6" sizeMd="3">
                <div
                  className={`stat-card success clickable ${memberStatusFilter === 'active' ? 'active-filter' : ''}`}
                  onClick={() => {
                    setMemberStatusFilter('active');
                    setPage(1);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMemberStatusFilter('active');
                      setPage(1);
                    }
                  }}
                >
                  <IonIcon icon={checkmark} />
                  <h3>{memberStats.active}</h3>
                  <p>Active Members</p>
                </div>
              </IonCol>
              <IonCol size="12" sizeSm="6" sizeMd="3">
                <div
                  className={`stat-card danger clickable ${memberStatusFilter === 'inactive' ? 'active-filter' : ''}`}
                  onClick={() => {
                    setMemberStatusFilter('inactive');
                    setPage(1);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMemberStatusFilter('inactive');
                      setPage(1);
                    }
                  }}
                >
                  <IonIcon icon={close} />
                  <h3>{memberStats.inactive}</h3>
                  <p>Inactive Members</p>
                </div>
              </IonCol>
              <IonCol size="12" sizeSm="6" sizeMd="3">
                <div
                  className={`stat-card warning clickable ${memberStatusFilter === 'pending' ? 'active-filter' : ''}`}
                  onClick={() => {
                    setMemberStatusFilter('pending');
                    setPage(1);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMemberStatusFilter('pending');
                      setPage(1);
                    }
                  }}
                >
                  <IonIcon icon={calendar} />
                  <h3>{memberStats.pending}</h3>
                  <p>Pending Payments</p>
                </div>
              </IonCol>
            </IonRow>

            {/* Search Bar */}
            <IonRow>
              <IonCol size="12">
                <IonSearchbar
                  value={searchText}
                  onIonInput={(e) => setSearchText(e.detail.value || '')}
                  placeholder="Search members..."
                  className="members-search"
                />
              </IonCol>
            </IonRow>

            {/* Members - table list view for better scalability */}
            <IonRow>
              <IonCol size="12">
                {loadingMembers ? (
                  <div className="empty-state">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="empty-state">
                    <IonIcon icon={person} />
                    <h3>{emptyStateTitle}</h3>
                    <p>{emptyStateDescription}</p>
                  </div>
                ) : (
                  <div className="members-table-wrapper">
                    <table className="members-table">
                      <thead>
                        <tr>
                          <th onClick={() => { if (sortBy === 'firstName') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('firstName'); setSortDir('asc'); } }} style={{cursor: 'pointer'}}>Name {sortBy === 'firstName' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                          <th onClick={() => { if (sortBy === 'email') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('email'); setSortDir('asc'); } }} style={{cursor: 'pointer'}}>Email {sortBy === 'email' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                          <th>Phone</th>
                          <th>Membership</th>
                          <th onClick={() => { if (sortBy === 'membershipPrice') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('membershipPrice'); setSortDir('asc'); } }} style={{cursor: 'pointer'}}>Price {sortBy === 'membershipPrice' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                          <th onClick={() => { if (sortBy === 'status') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('status'); setSortDir('asc'); } }} style={{cursor: 'pointer'}}>Status {sortBy === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                          <th onClick={() => { if (sortBy === 'paymentStatus') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('paymentStatus'); setSortDir('asc'); } }} style={{cursor: 'pointer'}}>Payment {sortBy === 'paymentStatus' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMembers.map((member) => (
                          <tr key={member.id} className="member-row">
                            <td>
                              <div className="name-cell">
                                <div className="avatar">
                                  <IonIcon icon={person} />
                                </div>
                                <div className="text">
                                  <div className="first">{member.firstName}</div>
                                  <div className="last">{member.lastName}</div>
                                </div>
                              </div>
                            </td>
                            <td>{member.email}</td>
                            <td>{member.phone}</td>
                            <td>{member.membershipType}</td>
                            <td>₱{member.membershipPrice?.toLocaleString()}</td>
                            <td>
                              <IonBadge color={getStatusColor(member.status)}>
                                {String(member.status || '').toUpperCase()}
                              </IonBadge>
                            </td>
                            <td>
                              <IonBadge color={getPaymentStatusColor(member.paymentStatus)}>
                                {String(member.paymentStatus || 'pending').toUpperCase()}
                              </IonBadge>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                              <IonButton
                                size="small"
                                fill="solid"
                                color="success"
                                onClick={() => handleRecordPayment(member)}
                                title="Record payment"
                                aria-label={`Record payment for ${member.firstName} ${member.lastName}`}
                                className="action-icon"
                              >
                                <IonIcon icon={card} />
                              </IonButton>

                              <IonButton
                                size="small"
                                fill="outline"
                                color="primary"
                                onClick={() => handleEditMember(member)}
                                title="Edit member"
                                aria-label={`Edit ${member.firstName} ${member.lastName}`}
                                className="action-icon"
                              >
                                <IonIcon icon={create} />
                              </IonButton>

                              <IonButton
                                size="small"
                                fill="outline"
                                color="danger"
                                onClick={() => member.id && handleDeleteMember(member.id)}
                                title="Delete member"
                                aria-label={`Delete ${member.firstName} ${member.lastName}`}
                                className="action-icon"
                              >
                                <IonIcon icon={trash} />
                              </IonButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="members-table-footer">
                      <div className="members-table-info">
                        {totalFilteredMembers > 0 ? (
                          <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalFilteredMembers)} of {totalFilteredMembers}</span>
                        ) : null}
                      </div>
                      <div className="members-table-controls">
                        <label style={{marginRight:8}}>Per page:</label>
                        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>

                        <div className="pagination">
                          {(() => {
                            const start = Math.max(1, page - 2);
                            const end = Math.min(totalPages, page + 2);
                            const pages = [] as number[];
                            for (let i = start; i <= end; i++) pages.push(i);
                            return (
                              <>
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                                {pages.map((p) => (
                                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Add/Edit Member Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="members-edit-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>{isEditing ? 'Edit Member' : 'Add Member'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">First Name *</IonLabel>
                <IonInput
                  value={currentMember.firstName}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, firstName: e.detail.value || '' })
                  }
                  placeholder="Enter first name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Last Name *</IonLabel>
                <IonInput
                  value={currentMember.lastName}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, lastName: e.detail.value || '' })
                  }
                  placeholder="Enter last name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Email *</IonLabel>
                <IonInput
                  type="email"
                  value={currentMember.email}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, email: e.detail.value || '' })
                  }
                  placeholder="Enter email"
                />
              </IonItem>

              {!isEditing && (
                <IonItem>
                  <IonLabel position="stacked">Password *</IonLabel>
                  <IonInput
                    type="password"
                    value={currentMember.password}
                    onKeyDown={handleMemberFormKeyDown}
                    onIonInput={(e) =>
                      setCurrentMember({ ...currentMember, password: e.detail.value || '' })
                    }
                    placeholder="Enter password"
                  />
                </IonItem>
              )}

              <IonItem>
                <IonLabel position="stacked">Mobile Number (+63) *</IonLabel>
                <IonInput
                  type="tel"
                  inputmode="tel"
                  maxlength={11}
                  value={currentMember.phone}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, phone: String(e.detail.value || '').replace(/\D/g, '').slice(0, 11) })
                  }
                  placeholder="09XXXXXXXXX"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Gender</IonLabel>
                <IonSelect
                  value={currentMember.gender}
                  onIonChange={(e) =>
                    setCurrentMember({ ...currentMember, gender: e.detail.value })
                  }
                >
                  <IonSelectOption value="male">Male</IonSelectOption>
                  <IonSelectOption value="female">Female</IonSelectOption>
                  <IonSelectOption value="other">Other</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Date of Birth</IonLabel>
                <IonInput
                  type="date"
                  max={todayDate}
                  value={currentMember.dateOfBirth}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, dateOfBirth: e.detail.value || '' })
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Membership Type</IonLabel>
                <IonSelect
                  value={currentMember.membershipType}
                  onIonChange={(e) => handleMembershipTypeChange(e.detail.value)}
                >
                  <IonSelectOption value="monthly">Monthly - ₱100</IonSelectOption>
                  <IonSelectOption value="quarterly">Quarterly - ₱200</IonSelectOption>
                  <IonSelectOption value="annual">Annual - ₱300</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Emergency Contact</IonLabel>
                <IonInput
                  value={currentMember.emergencyContact}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, emergencyContact: e.detail.value || '' })
                  }
                  placeholder="Enter emergency contact"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Address</IonLabel>
                <IonInput
                  value={currentMember.address}
                  onKeyDown={handleMemberFormKeyDown}
                  onIonInput={(e) =>
                    setCurrentMember({ ...currentMember, address: e.detail.value || '' })
                  }
                  placeholder="Enter address"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Status</IonLabel>
                <IonSelect
                  value={currentMember.status}
                  onIonChange={(e) =>
                    setCurrentMember({ ...currentMember, status: e.detail.value })
                  }
                >
                  <IonSelectOption value="active">Active</IonSelectOption>
                  <IonSelectOption value="inactive">Inactive</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
          </IonContent>
          <IonFooter>
            <div className="modal-actions">
              <IonButton expand="block" onClick={handleSaveMember} color="primary">
                <IonIcon icon={checkmark} slot="start" />
                {isEditing ? 'Update Member' : 'Add Member'}
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={() => setShowModal(false)}>
                Cancel
              </IonButton>
            </div>
          </IonFooter>
        </IonModal>

        {/* Record Payment Modal */}
        <IonModal isOpen={showPaymentModal} onDidDismiss={() => setShowPaymentModal(false)} className="members-payment-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Record Payment</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPaymentModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            {selectedMemberForPayment && (
              <>
                <div style={{ padding: '1rem', background: 'rgba(0, 230, 118, 0.1)', margin: '1rem', borderRadius: '8px' }}>
                  <h3 style={{ margin: 0, color: '#00e676' }}>
                    {selectedMemberForPayment.firstName} {selectedMemberForPayment.lastName}
                  </h3>
                  <p style={{ margin: '0.5rem 0 0', color: '#999' }}>{selectedMemberForPayment.email}</p>
                </div>

                <IonList>
                  <IonItem>
                    <IonLabel position="stacked">Membership Type</IonLabel>
                    <IonSelect
                      value={paymentData.membershipType}
                      onIonChange={(e) => handlePaymentMembershipTypeChange(e.detail.value)}
                    >
                      <IonSelectOption value="monthly">Monthly - ₱100</IonSelectOption>
                      <IonSelectOption value="quarterly">Quarterly - ₱200</IonSelectOption>
                      <IonSelectOption value="annual">Annual - ₱300</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Amount</IonLabel>
                    <IonInput
                      type="number"
                      value={paymentData.membershipPrice}
                      onKeyDown={handlePaymentFormKeyDown}
                      onIonInput={(e) => setPaymentData({ ...paymentData, membershipPrice: parseFloat(e.detail.value || '0') })}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Payment Method</IonLabel>
                    <IonSelect
                      value={paymentData.paymentMethod}
                      onIonChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.detail.value })}
                    >
                      <IonSelectOption value="cash">Cash</IonSelectOption>
                      <IonSelectOption value="paypal">PayPal</IonSelectOption>
                      <IonSelectOption value="bank_transfer">Bank Transfer</IonSelectOption>
                      <IonSelectOption value="check">Check</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                </IonList>
              </>
            )}
          </IonContent>

          <IonFooter>
            <div className="modal-actions">
              <IonButton
                expand="block"
                onClick={handleSavePayment}
                color="success"
                disabled={!selectedMemberForPayment || isSubmitting}
              >
                <IonIcon icon={checkmark} slot="start" />
                {isSubmitting ? 'Recording...' : `Record Payment (₱${paymentData.membershipPrice.toLocaleString()})`}
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </IonButton>
            </div>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default MembersManagement;