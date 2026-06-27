import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as blockAPI from '../api/blockAPI'
import * as floorAPI from '../api/floorAPI'
import * as roomAPI from '../api/roomAPI'
import Spinner from '../components/common/Spinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useAuth from '../hooks/useAuth'

function unpackList(res) {
  const list = res?.data?.data || res?.data || res || []
  return Array.isArray(list) ? list : []
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const ROOM_TYPES = [
  'Classroom',
  'Lab',
  'Office',
  'Library',
  'Restroom',
  'Storeroom',
  'Other',
]

export default function Infrastructure() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBlocks, setExpandedBlocks] = useState({})
  const [expandedFloors, setExpandedFloors] = useState({})
  const [floorsMap, setFloorsMap] = useState({})
  const [roomsMap, setRoomsMap] = useState({})
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedRoomFloor, setSelectedRoomFloor] = useState(null)
  const [selectedRoomBlock, setSelectedRoomBlock] = useState(null)
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  })
  const [submitting, setSubmitting] = useState(false)

  async function loadBlocks() {
    setLoading(true)
    try {
      const res = await blockAPI.getBlocks()
      const list = res?.data?.data || res?.data || res || []
      setBlocks(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load blocks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlocks()
  }, [])

  async function toggleBlock(block) {
    setExpandedBlocks((p) => {
      const next = { ...p, [block._id]: !p[block._id] }
      return next
    })

    const willExpand = !expandedBlocks[block._id]
    if (willExpand && !floorsMap[block._id]) {
      try {
        const res = await blockAPI.getBlockFloors(block._id)
        const floors = res?.data?.data || res?.data || res || []
        setFloorsMap((p) => ({
          ...p,
          [block._id]: Array.isArray(floors) ? floors : [],
        }))
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load floors')
      }
    }
  }

  async function toggleFloor(floor) {
    setExpandedFloors((p) => ({ ...p, [floor._id]: !p[floor._id] }))

    const willExpand = !expandedFloors[floor._id]
    if (willExpand && !roomsMap[floor._id]) {
      try {
        const res = await floorAPI.getFloorRooms(floor._id)
        const rooms = res?.data?.data || res?.data || res || []
        setRoomsMap((p) => ({
          ...p,
          [floor._id]: Array.isArray(rooms) ? rooms : [],
        }))
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load rooms')
      }
    }
  }

  function handleDeleteBlock(block) {
    setConfirm({
      isOpen: true,
      title: 'Delete Block?',
      message:
        'This will permanently delete the block and ALL its floors, rooms, and assets. This cannot be undone.',
      onConfirm: async () => {
        setConfirm({ isOpen: false })
        try {
          await blockAPI.deleteBlock(block._id)
          toast.success('Block deleted')
          await loadBlocks()
          setFloorsMap((p) => {
            const next = { ...p }
            delete next[block._id]
            return next
          })
          if (
            selectedRoomBlock?._id === block._id ||
            selectedRoom?.floor_id?.block_id?._id === block._id
          ) {
            setSelectedRoom(null)
            setSelectedRoomFloor(null)
            setSelectedRoomBlock(null)
          }
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to delete block')
        }
      },
    })
  }

  function handleDeleteFloor(floor) {
    setConfirm({
      isOpen: true,
      title: 'Delete Floor?',
      message: 'This will delete the floor and ALL its rooms and assets.',
      onConfirm: async () => {
        setConfirm({ isOpen: false })
        try {
          await floorAPI.deleteFloor(floor._id)
          toast.success('Floor deleted')
          const blockId =
            floor?.block_id?._id || floor?.block_id || modal?.data?.block_id
          if (blockId) {
            const res = await blockAPI.getBlockFloors(blockId)
            setFloorsMap((p) => ({ ...p, [blockId]: unpackList(res) }))
          }
          setRoomsMap((p) => {
            const next = { ...p }
            delete next[floor._id]
            return next
          })
          if (selectedRoomFloor?._id === floor._id) {
            setSelectedRoom(null)
            setSelectedRoomFloor(null)
            setSelectedRoomBlock(null)
          }
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to delete floor')
        }
      },
    })
  }

  function handleDeleteRoom(room) {
    setConfirm({
      isOpen: true,
      title: 'Delete Room?',
      message: 'Delete this room? (Only possible if no assets are linked.)',
      onConfirm: async () => {
        setConfirm({ isOpen: false })
        try {
          await roomAPI.deleteRoom(room._id)
          toast.success('Room deleted')
          const floorId = room?.floor_id?._id || room?.floor_id
          if (floorId) {
            const res = await floorAPI.getFloorRooms(floorId)
            setRoomsMap((p) => ({ ...p, [floorId]: unpackList(res) }))
          }
          if (selectedRoom?._id === room._id) {
            setSelectedRoom(null)
            setSelectedRoomFloor(null)
            setSelectedRoomBlock(null)
          }
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to delete room')
        }
      },
    })
  }

  const selectedAmenities = useMemo(() => {
    return {
      projector: !!selectedRoom?.has_projector,
      ac: !!selectedRoom?.has_ac,
    }
  }, [selectedRoom])

  const [blockForm, setBlockForm] = useState({
    block_name: '',
    block_code: '',
    description: '',
  })
  const [floorForm, setFloorForm] = useState({
    floor_number: '',
    floor_label: '',
  })
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_name: '',
    room_type: 'Classroom',
    seating_capacity: '',
    has_projector: false,
    has_ac: false,
    landmark: '',
  })

  useEffect(() => {
    if (modal.type === 'addBlock') {
      setBlockForm({ block_name: '', block_code: '', description: '' })
    }
    if (modal.type === 'editBlock') {
      const b = modal.data
      setBlockForm({
        block_name: b?.block_name || '',
        block_code: b?.block_code || '',
        description: b?.description || '',
      })
    }
    if (modal.type === 'addFloor') {
      setFloorForm({ floor_number: '', floor_label: '' })
    }
    if (modal.type === 'addRoom') {
      setRoomForm({
        room_number: '',
        room_name: '',
        room_type: 'Classroom',
        seating_capacity: '',
        has_projector: false,
        has_ac: false,
        landmark: '',
      })
    }
    if (modal.type === 'editRoom') {
      const r = modal.data
      setRoomForm({
        room_number: r?.room_number || '',
        room_name: r?.room_name || '',
        room_type: r?.room_type || 'Classroom',
        seating_capacity: r?.seating_capacity ?? '',
        has_projector: !!r?.has_projector,
        has_ac: !!r?.has_ac,
        landmark: r?.landmark || '',
      })
    }
  }, [modal.type, modal.data])

  async function submitBlock(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!blockForm.block_name.trim()) {
        toast.error('Block name is required')
        return
      }

      if (modal.type === 'addBlock') {
        await blockAPI.createBlock({
          block_name: blockForm.block_name.trim(),
          block_code: blockForm.block_code.trim() || undefined,
          description: blockForm.description.trim() || undefined,
        })
        toast.success('Block created')
      } else {
        await blockAPI.updateBlock(modal.data._id, {
          block_name: blockForm.block_name.trim(),
          block_code: blockForm.block_code.trim() || undefined,
          description: blockForm.description.trim() || undefined,
        })
        toast.success('Block updated')
      }

      await loadBlocks()
      setModal({ type: null, data: null })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save block')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFloor(e) {
    e.preventDefault()
    setSubmitting(true)
    const blockId = modal?.data?.block_id
    try {
      if (!blockId) {
        toast.error('Missing block id')
        return
      }
      if (floorForm.floor_number === '' || floorForm.floor_label.trim() === '') {
        toast.error('Floor number and label are required')
        return
      }

      await floorAPI.createFloor({
        block_id: blockId,
        floor_number: Number(floorForm.floor_number),
        floor_label: floorForm.floor_label.trim(),
      })
      toast.success('Floor created')

      const res = await blockAPI.getBlockFloors(blockId)
      setFloorsMap((p) => ({ ...p, [blockId]: unpackList(res) }))

      setModal({ type: null, data: null })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create floor')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitRoom(e) {
    e.preventDefault()
    setSubmitting(true)
    const floorId = modal?.data?.floor_id

    try {
      if (!floorId) {
        toast.error('Missing floor id')
        return
      }
      if (!roomForm.room_number.trim() || !roomForm.room_type) {
        toast.error('Room number and type are required')
        return
      }

      const payload = {
        floor_id: floorId,
        room_number: roomForm.room_number.trim(),
        room_name: roomForm.room_name.trim() || undefined,
        room_type: roomForm.room_type,
        seating_capacity:
          roomForm.seating_capacity === '' ? undefined : Number(roomForm.seating_capacity),
        has_projector: !!roomForm.has_projector,
        has_ac: !!roomForm.has_ac,
        landmark: roomForm.landmark.trim() || undefined,
      }

      if (modal.type === 'addRoom') {
        await roomAPI.createRoom(payload)
        toast.success('Room created')
      } else {
        await roomAPI.updateRoom(modal.data._id, payload)
        toast.success('Room updated')
      }

      const res = await floorAPI.getFloorRooms(floorId)
      setRoomsMap((p) => ({ ...p, [floorId]: unpackList(res) }))

      setModal({ type: null, data: null })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save room')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ isOpen: false })}
      />

      <div className="infra-layout">
        <div className="infra-left card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0 }}>Campus Infrastructure</h2>
            {isAdmin ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setModal({ type: 'addBlock', data: null })}
              >
                + Add Block
              </button>
            ) : null}
          </div>

          {loading ? (
            <Spinner />
          ) : blocks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blocks.map((block) => {
                const isOpen = !!expandedBlocks[block._id]
                const floors = floorsMap[block._id]
                return (
                  <div key={block._id} className="block-item">
                    <div className="block-header" onClick={() => toggleBlock(block)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
                        <strong>{block.block_name}</strong>
                        {block.block_code ? (
                          <span className="chip">{block.block_code}</span>
                        ) : null}
                      </div>

                      {isAdmin ? (
                        <div className="icon-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => setModal({ type: 'editBlock', data: block })}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDeleteBlock(block)}
                          >
                            🗑
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {isOpen ? (
                      <div className="floor-list">
                        {!floors ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            {floors.map((floor) => {
                              const floorOpen = !!expandedFloors[floor._id]
                              const rooms = roomsMap[floor._id]
                              return (
                                <div key={floor._id}>
                                  <div className="floor-row" onClick={() => toggleFloor(floor)}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                      }}
                                    >
                                      <span aria-hidden="true">
                                        {floorOpen ? '▼' : '▶'}
                                      </span>
                                      <span>
                                        {floor.floor_label}{' '}
                                        <span style={{ color: 'var(--color-text-light)' }}>
                                          (Floor {floor.floor_number})
                                        </span>
                                      </span>
                                    </div>

                                    {isAdmin ? (
                                      <div
                                        className="icon-actions"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          title="Delete"
                                          onClick={() => handleDeleteFloor(floor)}
                                        >
                                          🗑
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>

                                  {floorOpen ? (
                                    <div className="room-list">
                                      {!rooms ? (
                                        <Spinner size="sm" />
                                      ) : rooms.length ? (
                                        rooms.map((room) => (
                                          <div
                                            key={room._id}
                                            className={`room-row${
                                              selectedRoom?._id === room._id ? ' active' : ''
                                            }`}
                                            onClick={() => {
                                              setSelectedRoom(room)
                                              setSelectedRoomFloor(floor)
                                              setSelectedRoomBlock(block)
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                minWidth: 0,
                                              }}
                                            >
                                              <span style={{ fontWeight: 700 }}>
                                                {room.room_number}
                                              </span>
                                              <span
                                                style={{
                                                  color: 'var(--color-text-light)',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                }}
                                              >
                                                {room.room_name ? `- ${room.room_name}` : ''}
                                              </span>
                                              {room.room_type ? (
                                                <span className="chip chip-sm">
                                                  {room.room_type}
                                                </span>
                                              ) : null}
                                            </div>

                                            {isAdmin ? (
                                              <div
                                                className="icon-actions"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <button
                                                  type="button"
                                                  title="Edit"
                                                  onClick={() =>
                                                    setModal({
                                                      type: 'editRoom',
                                                      data: { ...room },
                                                    })
                                                  }
                                                >
                                                  ✏️
                                                </button>
                                                <button
                                                  type="button"
                                                  title="Delete"
                                                  onClick={() => handleDeleteRoom(room)}
                                                >
                                                  🗑
                                                </button>
                                              </div>
                                            ) : null}
                                          </div>
                                        ))
                                      ) : (
                                        <div
                                          style={{
                                            padding: '8px 16px 8px 48px',
                                            color: 'var(--color-text-light)',
                                          }}
                                        >
                                          No rooms yet.
                                        </div>
                                      )}

                                      {isAdmin ? (
                                        <div style={{ padding: '6px 16px 10px 48px' }}>
                                          <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() =>
                                              setModal({
                                                type: 'addRoom',
                                                data: { floor_id: floor._id },
                                              })
                                            }
                                          >
                                            + Add Room
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })}

                            {isAdmin ? (
                              <div style={{ padding: '8px 16px 8px 32px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() =>
                                    setModal({
                                      type: 'addFloor',
                                      data: { block_id: block._id },
                                    })
                                  }
                                >
                                  + Add Floor
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-light)' }}>No blocks found.</div>
          )}
        </div>

        <div className="infra-right">
          {!selectedRoom ? (
            <div
              className="card"
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--color-text-light)',
              }}
            >
              <div>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏫</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Select a room from the left to view details
                </div>
              </div>
            </div>
          ) : (
            <div className="card room-detail-card">
              <div className="breadcrumb" style={{ marginBottom: 10 }}>
                {selectedRoomBlock?.block_name || '—'} <span>›</span>{' '}
                {selectedRoomFloor?.floor_label || '—'} <span>›</span>{' '}
                <strong>{selectedRoom.room_number}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>
                    {selectedRoom.room_name || selectedRoom.room_number}
                  </h2>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedRoom.room_type ? (
                      <span className="chip">{selectedRoom.room_type}</span>
                    ) : null}
                    {selectedRoom.seating_capacity ? (
                      <span className="chip">
                        Capacity: {selectedRoom.seating_capacity}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(`/rooms/${selectedRoom._id}`)}
                  >
                    View Assets →
                  </button>
                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setModal({ type: 'editRoom', data: { ...selectedRoom } })
                        }
                      >
                        Edit Room
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDeleteRoom(selectedRoom)}
                      >
                        Delete Room
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="info-grid">
                  <div className="info-row">
                    <label>Room Number</label>
                    <span>{selectedRoom.room_number || '—'}</span>
                  </div>
                  <div className="info-row">
                    <label>Room Name</label>
                    <span>{selectedRoom.room_name || '—'}</span>
                  </div>
                  <div className="info-row">
                    <label>Room Type</label>
                    <span>{selectedRoom.room_type || '—'}</span>
                  </div>
                  <div className="info-row">
                    <label>Seating Capacity</label>
                    <span>{selectedRoom.seating_capacity ?? '—'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    className={`chip ${selectedAmenities.projector ? 'chip-green' : 'chip-gray'}`}
                  >
                    📽️ Projector: {selectedAmenities.projector ? 'Yes' : 'No'}
                  </span>
                  <span className={`chip ${selectedAmenities.ac ? 'chip-green' : 'chip-gray'}`}>
                    ❄️ AC: {selectedAmenities.ac ? 'Yes' : 'No'}
                  </span>
                </div>

                {selectedRoom.landmark ? (
                  <div style={{ marginTop: 14 }}>
                    <span className="chip chip-gray">📍 {selectedRoom.landmark}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal.type === 'addBlock' || modal.type === 'editBlock' ? (
        <Modal
          title={modal.type === 'addBlock' ? 'Add Block' : 'Edit Block'}
          onClose={() => (submitting ? null : setModal({ type: null, data: null }))}
        >
          <form onSubmit={submitBlock}>
            <div className="form-group">
              <label>Block Name *</label>
              <input
                className="form-control"
                value={blockForm.block_name}
                onChange={(e) => setBlockForm((p) => ({ ...p, block_name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Block Code</label>
              <input
                className="form-control"
                value={blockForm.block_code}
                onChange={(e) => setBlockForm((p) => ({ ...p, block_code: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={blockForm.description}
                onChange={(e) =>
                  setBlockForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModal({ type: null, data: null })}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal.type === 'addFloor' ? (
        <Modal
          title="Add Floor"
          onClose={() => (submitting ? null : setModal({ type: null, data: null }))}
        >
          <form onSubmit={submitFloor}>
            <div className="form-group">
              <label>Floor Number *</label>
              <input
                className="form-control"
                type="number"
                value={floorForm.floor_number}
                onChange={(e) => setFloorForm((p) => ({ ...p, floor_number: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Floor Label *</label>
              <input
                className="form-control"
                value={floorForm.floor_label}
                onChange={(e) => setFloorForm((p) => ({ ...p, floor_label: e.target.value }))}
                required
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModal({ type: null, data: null })}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal.type === 'addRoom' || modal.type === 'editRoom' ? (
        <Modal
          title={modal.type === 'addRoom' ? 'Add Room' : 'Edit Room'}
          onClose={() => (submitting ? null : setModal({ type: null, data: null }))}
        >
          <form onSubmit={submitRoom}>
            <div className="form-group">
              <label>Room Number *</label>
              <input
                className="form-control"
                value={roomForm.room_number}
                onChange={(e) =>
                  setRoomForm((p) => ({ ...p, room_number: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Room Name</label>
              <input
                className="form-control"
                value={roomForm.room_name}
                onChange={(e) => setRoomForm((p) => ({ ...p, room_name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Room Type *</label>
              <select
                value={roomForm.room_type}
                onChange={(e) => setRoomForm((p) => ({ ...p, room_type: e.target.value }))}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Seating Capacity</label>
              <input
                className="form-control"
                type="number"
                value={roomForm.seating_capacity}
                onChange={(e) =>
                  setRoomForm((p) => ({ ...p, seating_capacity: e.target.value }))
                }
              />
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={roomForm.has_projector}
                  onChange={(e) =>
                    setRoomForm((p) => ({ ...p, has_projector: e.target.checked }))
                  }
                />
                Has Projector
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={roomForm.has_ac}
                  onChange={(e) => setRoomForm((p) => ({ ...p, has_ac: e.target.checked }))}
                />
                Has AC
              </label>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Landmark</label>
              <input
                className="form-control"
                value={roomForm.landmark}
                onChange={(e) => setRoomForm((p) => ({ ...p, landmark: e.target.value }))}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModal({ type: null, data: null })}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

