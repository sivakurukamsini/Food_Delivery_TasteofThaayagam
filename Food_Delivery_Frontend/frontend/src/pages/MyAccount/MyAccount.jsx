import { useEffect, useState, useContext } from 'react';
import { StoreContext } from '../../Context/StoreContext';
import './MyAccount.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyAccount = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState({ firstName: '', lastName: '', email: '', phone: '', image: '' });
	// get setter from context at top-level (do not call hooks inside handlers)
	const { setUser: setUserFromContext } = useContext(StoreContext) || {};
	const [password, setPassword] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');
	const [imagePreview, setImagePreview] = useState(null);
	const [imageFile, setImageFile] = useState(null);

	useEffect(() => {
		try {
			const u = JSON.parse(localStorage.getItem('user')) || {};
			setUser({
				firstName: u.firstName || (u.name ? u.name.split(' ')[0] : ''),
				lastName: u.lastName || (u.name ? u.name.split(' ').slice(1).join(' ') : ''),
				email: u.email || '',
				phone: u.phone || '',
				image: u.image || '',
			});
			// If stored image is a filename (not full URL), convert to backend images path
			const baseApi = (window.__env__ && window.__env__.API_URL) || 'http://localhost:5001';
			let preview = u.image || null;
			if (preview && typeof preview === 'string' && !/^https?:\/\//i.test(preview) && !/^data:/i.test(preview) && !/^blob:/i.test(preview)) {
				preview = `${baseApi}/images/${preview}`;
			}
			setImagePreview(preview);
		} catch (e) {
			// ignore
		}
	}, []);

	const onChange = (e) => setUser((p) => ({ ...p, [e.target.name]: e.target.value }));

	const onImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const onSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setMessage('');

		try {
				const stored = JSON.parse(localStorage.getItem('user')) || {};
			const id = stored.id || stored._id;
			if (!id) throw new Error('User id missing');

			const formData = new FormData();
			formData.append('firstName', user.firstName);
			formData.append('lastName', user.lastName);
			formData.append('name', `${user.firstName} ${user.lastName}`.trim());
			formData.append('email', user.email);
			if (user.phone) formData.append('phone', user.phone);
			if (password) formData.append('password', password);
			if (imageFile) formData.append('image', imageFile);

			const url = (window.__env__ && window.__env__.API_URL) || 'http://localhost:5001';
			const res = await axios.put(`${url}/api/users/${id}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			if (res.data && res.data.success) {
				setMessage('Saved successfully');
				// Prefer server-provided data (may include image filename)
				const updated = res.data.data || { ...stored, ...user };
				// Normalize image in updated and localStorage: backend may return image filename
				if (updated && updated.image) {
					const baseApi = (window.__env__ && window.__env__.API_URL) || 'http://localhost:5001';
					if (typeof updated.image === 'string' && !/^https?:\/\//i.test(updated.image) && !/^data:/i.test(updated.image) && !/^blob:/i.test(updated.image)) {
						// backend returned a filename -> show preview using backend images route
						setImagePreview(`${baseApi}/images/${updated.image}`);
					} else {
						setImagePreview(updated.image);
					}
				}
				updated.id = updated.id || updated._id || id;
				// Persist minimal user object (keep image as filename if returned)
				const minimal = { id: updated.id || id, firstName: updated.firstName, lastName: updated.lastName, name: updated.name, email: updated.email, phone: updated.phone };
				if (updated.image) minimal.image = updated.image;
				localStorage.setItem('user', JSON.stringify(minimal));
				// update context user if available (use setUserFromContext to avoid name collision)
				try {
					console.log('MyAccount: updating context user with', minimal);
					if (setUserFromContext) setUserFromContext(minimal);
					console.log('MyAccount: setUserFromContext called');
				} catch(e) { console.error('MyAccount: setUserFromContext error', e); }
				setPassword('');
				setTimeout(() => setMessage(''), 2500);
			} else {
				setMessage(res.data.message || 'Save failed');
			}
		} catch (err) {
			console.error(err);
			setMessage(err.response?.data?.message || err.message || 'Error saving');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="myaccount-page">
			<form className="myaccount-card" onSubmit={onSave}>
				<header className="account-header">
					<div className="avatar-wrap">
						{imagePreview ? (
							<img src={imagePreview} alt="Preview" className="profile-preview" />
						) : (
							<div className="avatar-initial-large">{(user.firstName || user.name || '').charAt(0).toUpperCase()}</div>
						)}
						<label className="change-photo">
							<input type="file" accept="image/*" onChange={onImageChange} />
							Change Photo
						</label>
					</div>
					<div className="account-meta">
						<h2 className="account-title">My Account</h2>
						<p className="account-name">{user.firstName} {user.lastName}</p>
						<p className="account-email">{user.email}</p>
					</div>
				</header>

				<section className="account-body">
					<div className="form-row">
						<div className="form-col">
							<label>First name</label>
							<input name="firstName" value={user.firstName} onChange={onChange} />
						</div>
						<div className="form-col">
							<label>Last name</label>
							<input name="lastName" value={user.lastName} onChange={onChange} />
						</div>
					</div>

					<div className="form-row">
						<div className="form-col">
							<label>Contact (phone)</label>
							<input name="phone" value={user.phone} onChange={onChange} />
						</div>
						<div className="form-col">
							<label>Email</label>
							<input name="email" type="email" value={user.email} onChange={onChange} />
						</div>
					</div>

					<div className="form-row">
						<div className="form-col full">
							<label>New password (leave blank to keep)</label>
							<input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
					</div>

					<div className="actions">
						<button type="submit" disabled={saving} className="primary">{saving ? 'Saving...' : 'Save Changes'}</button>
						<button type="button" className="cancel" onClick={() => navigate('/')}>Cancel</button>
					</div>
					{message && <p className="message">{message}</p>}
				</section>
			</form>
		</div>
	);
};

export default MyAccount;
