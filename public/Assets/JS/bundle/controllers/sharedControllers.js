import axios from "axios";

export const sendOtp = async (phone, qry) => {
  try {
    await axios({
      method: "POST",
      url: `/api/v1/user/user-otp?${qry}=true`,
      data: { ...phone },
    }).then((res) => {
      if (res.data.status === "Success") {
        let elmt;
        if (qry === "login") elmt = document.getElementById("otp_section");
        else elmt = document.getElementById("otp_sectionx");
        elmt.classList.add("d-block");
        elmt.classList.remove("d-none");
        if (qry === "login")
          document.getElementById("verification_otp").value = res.data.otp;
        else document.getElementById("verification_otpx").value = res.data.otp;
      }
    });
  } catch (err) {
    if (err?.response?.data?.message) {
      return alert(err.response.data.message);
    } else return alert("Somthing went wrong. Please try again.");
  }
};
export const verifyOtp = async (phone, otp) => {
  try {
    await axios({
      method: "PATCH",
      url: "/api/v1/user/verify-user",
      data: { phone, otp },
    }).then((res) => {
      if (res.data.status === "Success") {
        return location.assign("/");
      }
    });
  } catch (err) {
    if (err?.response?.data?.message) {
      return alert(err.response.data.message);
    } else return alert("Somthing went wrong. Please try again.");
  }
};

export const updateUser = async (data) => {
  try {
    await axios({
      method: "PATCH",
      url: "/api/v1/user/update-me",
      data,
    }).then((res) => {
      if (res.data.status === "Success") {
        alert("Your details updated successfully.");
        return location.reload();
      }
    });
  } catch (err) {
    if (err?.response?.data?.message) {
      return alert(err.response.data.message);
    } else return alert("Somthing went wrong. Please try again.");
  }
};
