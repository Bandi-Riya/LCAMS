import axiosInstance from './axiosInstance'

async function downloadBlob(url, params, filename) {
  const response = await axiosInstance.get(url, {
    params,
    responseType: 'blob',
  })

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export async function exportAssetsPDF(params) {
  await downloadBlob('/reports/assets/pdf', params, 'assets-report.pdf')
}

export async function exportAssetsExcel(params) {
  await downloadBlob('/reports/assets/excel', params, 'assets-report.xlsx')
}

export async function exportMaintenancePDF(params) {
  await downloadBlob('/reports/maintenance/pdf', params, 'maintenance-report.pdf')
}

export async function exportMaintenanceExcel(params) {
  await downloadBlob('/reports/maintenance/excel', params, 'maintenance-report.xlsx')
}

